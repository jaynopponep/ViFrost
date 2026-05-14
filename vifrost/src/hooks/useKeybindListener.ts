import { useRef, useCallback, useMemo } from "react";
import { EditorView } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";

const SCORE_NORMAL_MODE_EDIT = -5;
const SCORE_NAV_SHORTCUT = 20;

type VimModeChangeEvent = { mode: string };
type VimCm = {
  on(event: "vim-mode-change", h: (e: VimModeChangeEvent) => void): void;
};
export type EditorViewWithVim = EditorView & { cm?: VimCm };

export function useKeybindListener(sendScoreUpdate: (delta: number) => void) {
  const sendScoreUpdateRef = useRef(sendScoreUpdate);
  sendScoreUpdateRef.current = sendScoreUpdate;

  const vimModeRef = useRef<string>("normal");
  const keyBufferRef = useRef<string>("");
  // tracks cursor position after "f" so points only award if cursor actually moved
  const fNavPendingRef = useRef<number | null>(null);
  // set when a nav shortcut (w/b/f/{n}j) already sent points so onEditorUpdate skips the -5
  const navSentRef = useRef(false);

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
      sendScoreUpdateRef.current(SCORE_NORMAL_MODE_EDIT);
    }
  }, []);

  const scoreExtension = useMemo(
    () => [EditorView.updateListener.of(onEditorUpdate)],
    [onEditorUpdate],
  );

  return { attachVimModeListener, scoreExtension };
}
