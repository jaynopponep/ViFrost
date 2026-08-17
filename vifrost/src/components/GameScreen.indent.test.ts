import { describe, it, expect } from "vitest";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorSelection } from "@codemirror/state";
import { insertNewlineAndIndent } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { buildEditorExtensions } from "./editorExtensions";

// snippets (server/code_snippets/*) are authored with 4-space indentation.
// pressing Enter inside a python suite must continue at the same 4-space
// based column, not codemirror's default 2-space indentUnit. this is the
// "indent is slightly less than the previous line" bug.
const SNIPPET = [
  "class MinStack:",
  "    def __init__(self):",
  "        self.minStack = {}",
].join("\n");

// run insertNewlineAndIndent (what Enter does via basicSetup) with the
// cursor at the end of the 8-space body line, return the new line's indent.
function indentAfterEnter(langExtensions: Extension[]): number {
  const cursor = SNIPPET.length; // end of "        self.minStack = {}"
  let state = EditorState.create({
    doc: SNIPPET,
    selection: EditorSelection.cursor(cursor),
    extensions: langExtensions,
  });
  insertNewlineAndIndent({
    state,
    dispatch: (tr) => {
      state = tr.state;
    },
  });
  const newLine = state.doc.lineAt(state.selection.main.head);
  return newLine.text.match(/^ */)![0].length;
}

describe("GameScreen python auto-indent", () => {
  it("default indentUnit (2 spaces) under-indents 4-space snippets (the bug)", () => {
    // documents the broken default: continuation lands below 8 spaces.
    expect(indentAfterEnter([python()])).toBeLessThan(8);
  });

  it("GameScreen's real extensions keep the snippet's 4-space indentation", () => {
    expect(indentAfterEnter(buildEditorExtensions(false))).toBe(8);
  });
});
