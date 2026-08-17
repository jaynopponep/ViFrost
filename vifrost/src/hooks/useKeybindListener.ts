import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { EditorView } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import { Vim } from "@replit/codemirror-vim";
import {
  PENALTY_ARROW,
  PENALTY_MOUSE,
  PENALTY_COUNTER_PRODUCTIVE,
  isExactReversal,
  type NavCommand,
  type NavAxis,
  type KeybindEventKind,
} from "./vimPenalty";

const SCORE_NORMAL_MODE_EDIT = -5;
const SCORE_NAV_SHORTCUT = 20;
const SCORE_MACRO_USAGE = 50;

// claude counter-productive (-60 per exact same-count opposite-direction reversal,
// e.g. 10j then 10k) but i disabled since it might be finnicky

const COUNTER_PRODUCTIVE_ENABLED = false;

type VimModeChangeEvent = { mode: string };
type VimCm = {
  on(event: "vim-mode-change", h: (e: VimModeChangeEvent) => void): void;
};
export type EditorViewWithVim = EditorView & { cm?: VimCm };
type VimRegister = { keyBuffer: string[]; toString(): string };
type VimGlobalState = {
  registerController: { getRegister(name?: string): VimRegister };
  macroModeState: { latestRegister: string | undefined; isPlaying: boolean };
};
type VimWithGlobalState = typeof Vim & { getVimGlobalState_(): VimGlobalState };

export function useKeybindListener(
  sendKeybindEvent: (kind: KeybindEventKind, count?: number) => void,
  // the server only accepts keybind_event while the match is live (see
  // AcceptsGameplay). the editor stays mounted (read-only) during
  // countdown/after submit/after end, where keydown+selection still fire but
  // the server rejects the event. without this gate the cosmetic floats would
  // show for keystrokes the server never scored. defaults true so the preview
  // page (no real match) is unaffected.
  scoringActive: boolean = true,
) {
  const sendKeybindEventRef = useRef(sendKeybindEvent);
  sendKeybindEventRef.current = sendKeybindEvent;
  const scoringActiveRef = useRef(scoringActive);
  scoringActiveRef.current = scoringActive;

  // every emitted delta also feeds the floating animation. a queue (not a
  // single latest-value state) is required: a penalised nav emits two deltas
  // synchronously in one handler (e.g. -60 then +20); react 18 batches the
  // setState calls, so a single-value state would only ever surface the last
  // one and silently drop the penalty float. functional appends survive the
  // batch in order. id is monotonic so identical consecutive values are
  // distinct list entries.
  // hard cap independent of the consumer: VimDeltaFloat drains by id via
  // dismissVimDelta, but the queue must stay bounded even if a consumer is
  // absent or buggy. floats live <1s so a small cap can never drop a
  // still-visible one; oldest entries fall off first.
  const VIM_DELTA_CAP = 40;
  const [vimDeltas, setVimDeltas] = useState<{ id: number; value: number }[]>([]);
  const deltaIdRef = useRef(0);

  // emit reports a vim event to the server (which owns the score) and queues
  // the cosmetic float. value is only the float number, the scoreboard reads
  // the server total. value 0 still reports the event (so server-side macro
  // escalation keeps counting) but shows no float.
  const emit = useCallback(
    (kind: KeybindEventKind, value: number, count: number = 1) => {
      // outside live the server rejects the event anyway, suppressing fully
      // stops post-submit phantom floats.
      if (!scoringActiveRef.current) return;
      sendKeybindEventRef.current(kind, count);
      if (value === 0) return;
      deltaIdRef.current += 1;
      const id = deltaIdRef.current;
      setVimDeltas((prev) =>
        [...prev, { id, value }].slice(-VIM_DELTA_CAP),
      );
    },
    [],
  );
  const emitRef = useRef(emit);
  emitRef.current = emit;

  // VimDeltaFloat calls this once each float finishes animating; the cap
  // above is the backstop if no consumer drains.
  const dismissVimDelta = useCallback((id: number) => {
    setVimDeltas((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // counter-productive: last counted nav command, or null if a cursor
  // move has since intervened.
  const lastNavRef = useRef<NavCommand | null>(null);

  const vimModeRef = useRef<string>("normal");
  const keyBufferRef = useRef<string>("");
  // tracks cursor position after "f" so points only award if cursor actually moved
  const fNavPendingRef = useRef<number | null>(null);
  // set when a nav shortcut (w/b/{n}j) already sent points so onEditorUpdate skips the -5
  const navSentRef = useRef(false);
  const macroUseCountRef = useRef<Map<string, number>>(new Map());

  // every view.dom listener below is registered with this controller's signal,
  // so a single abort() removes all of them. it is aborted when the editor is
  // recreated and on unmount, otherwise listeners (and their rAF closures over
  // the old view) accumulate on each remount.
  const listenerAbortRef = useRef<AbortController | null>(null);

  const attachVimModeListener = useCallback((view: EditorViewWithVim) => {
    listenerAbortRef.current?.abort();
    const controller = new AbortController();
    listenerAbortRef.current = controller;
    const { signal } = controller;
    view.focus();

    view.cm?.on("vim-mode-change", (e) => {
      vimModeRef.current = e.mode;
      keyBufferRef.current = "";
      fNavPendingRef.current = null;
    });

    // a scored nav / arrow / mouse-jump suppresses the -5 move penalty for the
    // WHOLE cluster of view updates it triggers this frame. one vim motion
    // (e.g. `5j`) commonly emits several updates: the move itself, then a
    // column clamp and/or a scroll-into-view adjust. the old code consumed
    // navSentRef on the *first* update, so a second selection update from the
    // same motion still hit the -5 path — that is the "+20 and -5 on 5j" bug.
    // instead: hold the suppression until the next animation frame, then
    // always release it. on a no-op nav (cursor never moved) also restore the
    // prior nav so it does not anchor reversal adjacency 
    const endNavSuppression = (
      before: number,
      prevNav?: NavCommand | null,
    ) => {
      requestAnimationFrame(() => {
        if (!view.dom.isConnected) return;
        const moved = view.state.selection.main.head !== before;
        navSentRef.current = false;
        if (!moved && prevNav !== undefined) lastNavRef.current = prevNav;
      });
    };

    // arrow keys are bad navigation in any mode.
    view.dom.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        // gate the whole scoring subsystem (not just emit) outside live, so no
        // scoring state — lastNavRef, macro counts, buffers — is mutated by
        // pre-live/post-submit keystrokes and bleeds into the live match.
        if (!scoringActiveRef.current) return;
        if (
          event.key === "ArrowUp" ||
          event.key === "ArrowDown" ||
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight"
        ) {
          emitRef.current("arrow_penalty", PENALTY_ARROW);
          lastNavRef.current = null;
          // an arrow move is already penalised at PENALTY_ARROW; suppress the
          // follow-up normal-mode -5 so it is not double-charged. only matters
          // in normal mode (insert mode never charges the -5 anyway).
          if (vimModeRef.current === "normal") {
            navSentRef.current = true;
            endNavSuppression(view.state.selection.main.head);
          }
        }
      },
      { capture: true, signal },
    );

    // mouse navigation. a mousedown in the editor that lands on a
    // different position than the current cursor is a mouse jump. capture
    // phase so navSentRef is set before codemirror processes the click and
    // before the synchronous -5 in onEditorUpdate could fire.
    view.dom.addEventListener(
      "mousedown",
      () => {
        if (!scoringActiveRef.current) return;
        const hadFocus = view.hasFocus;
        const before = view.state.selection.main.head;

        // might edit below later, people can technically abuse out of focus in
        // focus to use mouse

        // entering the editor (the first click just to focus it at match
        // start) is not mouse navigation — it must not be penalised, nor
        // trigger the -5 from the cursor placement it causes.
        if (!hadFocus) {
          navSentRef.current = true;
          endNavSuppression(before);
          return;
        }
        // a click that moves the cursor is already penalised at PENALTY_MOUSE;
        // pre-suppress the follow-up normal-mode -5 (emitted synchronously
        // when the click changes the selection, before the rAF below runs).
        if (vimModeRef.current === "normal") navSentRef.current = true;
        requestAnimationFrame(() => {
          // editor may unmount between mousedown and the next frame.
          // `destroyed` is private in this codemirror version; a detached dom
          // is the public signal that the view is gone.
          if (!view.dom.isConnected) return;
          if (view.state.selection.main.head !== before) {
            emitRef.current("mouse_penalty", PENALTY_MOUSE);
            lastNavRef.current = null;
          }
          // release the suppression for the whole click update cluster (the
          // selection change plus any scroll adjust) on the next frame.
          navSentRef.current = false;
        });
      },
      { capture: true, signal },
    );

    view.dom.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        if (!scoringActiveRef.current) return;
        if (vimModeRef.current !== "normal") return;

        const key = event.key;
        const buf = keyBufferRef.current;

        if (buf === "f") {
          if (["Shift", "Control", "Alt", "Meta"].includes(key)) return;
          fNavPendingRef.current = view.state.selection.main.head;
          keyBufferRef.current = "";
          return;
        }

        fNavPendingRef.current = null;

        if (key === "f" && buf === "") {
          keyBufferRef.current = "f";
          return;
        }

        // pending macro execution: buf is "@" or "4@" etc.
        if (/^\d*@$/.test(buf)) {
          keyBufferRef.current = "";
          const count = buf.length > 1 ? parseInt(buf.slice(0, -1)) : 1;
          const gs = (
            Vim as unknown as VimWithGlobalState
          ).getVimGlobalState_();
          const regName =
            key === "@"
              ? gs.macroModeState.latestRegister
              : /^[a-z]$/.test(key)
                ? key
                : undefined;
          if (regName) {
            const reg = gs.registerController.getRegister(regName);
            if (reg.toString().length > 0) {
              const prev = macroUseCountRef.current.get(regName) ?? 0;
              let totalDelta = 0;
              for (let i = 0; i < count; i++) {
                const n = prev + i + 1;
                if (n >= 2) {
                  totalDelta += Math.round(
                    SCORE_MACRO_USAGE * Math.pow(1.05, n - 2),
                  );
                }
              }
              macroUseCountRef.current.set(regName, prev + count);
              // always report so the server-side escalation count advances,
              // even when this run is worth 0. totalDelta is only the float.
              emitRef.current("macro_usage", totalDelta, count);
            }
          }
          return;
        }

        // "@" initiates macro sequence; numeric prefix is already in buf
        if (key === "@" && /^\d*$/.test(buf)) {
          keyBufferRef.current = buf + "@";
          return;
        }

        if (key === "w" || key === "b") {
          const before = view.state.selection.main.head;
          const prevNav = lastNavRef.current;
          navSentRef.current = true;
          const cmd: NavCommand = { axis: "word", forward: key === "w", count: 1 };
          // counter-productive disabled (see COUNTER_PRODUCTIVE_ENABLED).
          if (COUNTER_PRODUCTIVE_ENABLED && isExactReversal(prevNav, cmd)) {
            emitRef.current("counter_productive", PENALTY_COUNTER_PRODUCTIVE);
          }
          emitRef.current("nav_shortcut", SCORE_NAV_SHORTCUT);
          lastNavRef.current = cmd;
          keyBufferRef.current = "";
          endNavSuppression(before, prevNav);
          return;
        }

        if (/^\d$/.test(key)) {
          keyBufferRef.current = buf + key;
          return;
        }

        // {n}hjkl — only awards when a numeric count is present
        if ("hjkl".includes(key) && key.length === 1 && /^\d+$/.test(buf)) {
          const before = view.state.selection.main.head;
          const prevNav = lastNavRef.current;
          navSentRef.current = true;
          const axis: NavAxis = key === "h" || key === "l" ? "horizontal" : "vertical";
          const forward = key === "j" || key === "l";
          const cmd: NavCommand = { axis, forward, count: parseInt(buf, 10) };
          // counter-productive disabled (see COUNTER_PRODUCTIVE_ENABLED).
          if (COUNTER_PRODUCTIVE_ENABLED && isExactReversal(prevNav, cmd)) {
            emitRef.current("counter_productive", PENALTY_COUNTER_PRODUCTIVE);
          }
          emitRef.current("nav_shortcut", SCORE_NAV_SHORTCUT);
          lastNavRef.current = cmd;
          keyBufferRef.current = "";
          endNavSuppression(before, prevNav);
          return;
        }

        keyBufferRef.current = "";
      },
      { capture: true, signal },
    );
  }, []);

  const onEditorUpdate = useCallback((update: ViewUpdate) => {
    if (!scoringActiveRef.current) return;
    if (vimModeRef.current === "insert") {
      // an insert-mode edit is an intervening action; it must break
      // exact-reversal adjacency or a later opposite nav is wrongly -60'd.
      lastNavRef.current = null;
      return;
    }

    // f{char} verification: cursor must have moved for the point to count
    if (fNavPendingRef.current !== null) {
      const prevPos = fNavPendingRef.current;
      fNavPendingRef.current = null;
      if (update.state.selection.main.head !== prevPos) {
        // intentional scope decision: only lowercase `f` is buffered/scored by
        // the existing listener; capital-`F` reverse-find is deliberately not
        // counted (counting it would change the teammate's scoring mechanics,
        // out of scope per spec). so forward is always true here and find-axis
        // reversal effectively cannot trigger; vertical/horizontal/word
        // reversals are the practical triggers. do not "fix" this to add F.
        const cmd: NavCommand = { axis: "find", forward: true, count: 1 };
        // counter-productive disabled (see COUNTER_PRODUCTIVE_ENABLED).
        if (COUNTER_PRODUCTIVE_ENABLED && isExactReversal(lastNavRef.current, cmd)) {
          emitRef.current("counter_productive", PENALTY_COUNTER_PRODUCTIVE);
        }
        emitRef.current("nav_shortcut", SCORE_NAV_SHORTCUT);
        lastNavRef.current = cmd;
      }
      return;
    }

    // a scored nav holds this until the next animation frame (see
    // endNavSuppression), so every update in the motion's cluster is skipped,
    // not just the first.
    if (navSentRef.current) return;

    if (update.selectionSet || update.docChanged) {
      const gs = (Vim as unknown as VimWithGlobalState).getVimGlobalState_();
      if (gs.macroModeState.isPlaying) {
        // macro playback moves the cursor; that is an intervening move and
        // must also break exact-reversal adjacency.
        lastNavRef.current = null;
        return;
      }
      // any non-nav cursor move breaks exact-reversal adjacency.
      lastNavRef.current = null;
      emitRef.current("normal_edit", SCORE_NORMAL_MODE_EDIT);
    }
  }, []);

  const scoreExtension = useMemo(
    () => [EditorView.updateListener.of(onEditorUpdate)],
    [onEditorUpdate],
  );

  // remove all editor listeners when the hook unmounts.
  useEffect(() => {
    return () => listenerAbortRef.current?.abort();
  }, []);

  return {
    attachVimModeListener,
    scoreExtension,
    vimDeltas,
    dismissVimDelta,
  };
}
