import { useRef, useCallback, useMemo } from "react";
import { EditorView } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import { Vim } from "@replit/codemirror-vim";

const SCORE_NORMAL_MODE_EDIT = -5;
const SCORE_NAV_SHORTCUT = 20;
const SCORE_MACRO_USAGE = 50;

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

export function useKeybindListener(sendScoreUpdate: (delta: number) => void) {
  const sendScoreUpdateRef = useRef(sendScoreUpdate);
  sendScoreUpdateRef.current = sendScoreUpdate;

  const vimModeRef = useRef<string>("normal");
  const keyBufferRef = useRef<string>("");
  // tracks cursor position after "f" so points only award if cursor actually moved
  const fNavPendingRef = useRef<number | null>(null);
  // set when a nav shortcut (w/b/{n}j) already sent points so onEditorUpdate skips the -5
  const navSentRef = useRef(false);
  const macroUseCountRef = useRef<Map<string, number>>(new Map());

  const attachVimModeListener = useCallback((view: EditorViewWithVim) => {
    view.focus();

    view.cm?.on("vim-mode-change", (e) => {
      vimModeRef.current = e.mode;
      keyBufferRef.current = "";
      fNavPendingRef.current = null;
    });

    view.dom.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
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
              if (totalDelta > 0) sendScoreUpdateRef.current(totalDelta);
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
          navSentRef.current = true;
          sendScoreUpdateRef.current(SCORE_NAV_SHORTCUT);
          keyBufferRef.current = "";
          return;
        }

        if (/^\d$/.test(key)) {
          keyBufferRef.current = buf + key;
          return;
        }

        // {n}hjkl — only awards when a numeric count is present
        if ("hjkl".includes(key) && key.length === 1 && /^\d+$/.test(buf)) {
          navSentRef.current = true;
          sendScoreUpdateRef.current(SCORE_NAV_SHORTCUT);
          keyBufferRef.current = "";
          return;
        }

        keyBufferRef.current = "";
      },
      { capture: true },
    );
  }, []);

  const onEditorUpdate = useCallback((update: ViewUpdate) => {
    if (vimModeRef.current === "insert") return;

    // f{char} verification: cursor must have moved for the point to count
    if (fNavPendingRef.current !== null) {
      const prevPos = fNavPendingRef.current;
      fNavPendingRef.current = null;
      if (update.state.selection.main.head !== prevPos) {
        sendScoreUpdateRef.current(SCORE_NAV_SHORTCUT);
      }
      return;
    }

    if (navSentRef.current) {
      navSentRef.current = false;
      return;
    }

    if (update.selectionSet || update.docChanged) {
      const gs = (Vim as unknown as VimWithGlobalState).getVimGlobalState_();
      if (gs.macroModeState.isPlaying) return;
      sendScoreUpdateRef.current(SCORE_NORMAL_MODE_EDIT);
    }
  }, []);

  const scoreExtension = useMemo(
    () => [EditorView.updateListener.of(onEditorUpdate)],
    [onEditorUpdate],
  );

  return { attachVimModeListener, scoreExtension };
}
