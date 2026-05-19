import { describe, it, expect, afterEach } from "vitest";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, EditorSelection } from "@codemirror/state";
import { defaultKeymap } from "@codemirror/commands";
import { getCM, Vim } from "@replit/codemirror-vim";
import { buildEditorExtensions } from "./editorExtensions";

// faithful reproduction of the REAL app path: full editor stack with
// vim() active, basicSetup's defaultKeymap (Enter -> insertNewlineAndIndent),
// and a programmatic vim insert-mode <CR>. this is the path the player
// actually uses while editing a snippet, unlike the earlier direct-command
// test.
const SNIPPET = [
  "class MinStack:",
  "    def __init__(self):",
  "        self.minStack = {}",
].join("\n");

let view: EditorView;
afterEach(() => view?.destroy());

function newlineIndentInVimInsertMode(): number {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  view = new EditorView({
    parent,
    state: EditorState.create({
      doc: SNIPPET,
      selection: EditorSelection.cursor(SNIPPET.length), // end of 8-space line
      // buildEditorExtensions(true) => [vim(), python(), indentUnit('    ')].
      // defaultKeymap is what @uiw basicSetup adds (Enter binding).
      extensions: [buildEditorExtensions(true), keymap.of(defaultKeymap)],
    }),
  });
  const cm = getCM(view)!;
  // drive vim exactly like a keypress would: enter insert mode, send <CR>.
  Vim.handleKey(cm, "i", "user");
  Vim.handleKey(cm, "<CR>", "user");
  const line = view.state.doc.lineAt(view.state.selection.main.head);
  return line.text.match(/^ */)![0].length;
}

describe("vim insert-mode Enter on a 4-space snippet", () => {
  it("auto-indents to the snippet's 4-space column (not 2)", () => {
    expect(newlineIndentInVimInsertMode()).toBe(8);
  });
});
