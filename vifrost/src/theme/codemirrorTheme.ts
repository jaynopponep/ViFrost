// custom codemirror dark theme matching the app's `.dark` palette in
// index.css (the same deep-teal look the landing page uses). built from the
// palette values directly so the editor blends into the dark match ui instead
// of using @uiw's generic slate dark theme.
//
// keep these in sync with the `.dark` block in index.css. css custom
// properties remain the source of truth for the rest of the app; codemirror
// needs concrete values at extension-build time so they are mirrored here.

import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

const bg = "#122932"; // --colorMain (landing / dark background)
const surfaceAlt = "#14303a"; // --colorSurfaceAlt
const border = "#1f3d4a"; // --colorBorder
const text = "rgba(255, 255, 255, 0.87)"; // --colorText
const muted = "#888888"; // --colorTextMuted
const cyan = "#9de3f7"; // --colorCyan (accent)
const pink = "#e3c0d3"; // --colorPink
const cyanDim = "rgba(157, 227, 247, 0.14)"; // --colorCyanDim
const cyanGlow = "rgba(157, 227, 247, 0.28)"; // --colorCyanGlow

const editorTheme = EditorView.theme(
  {
    "&": {
      color: text,
      backgroundColor: bg,
      // codemirror's core (light) theme uses the bare `monospace` keyword,
      // which browsers render at the small monospace default and which does
      // not inherit the page font-size. our custom family disables that
      // quirk, so without an explicit size dark text inherits 16px and looks
      // bigger than light. pin it so both themes match.
      fontSize: "13px",
    },
    ".cm-content": {
      caretColor: cyan,
      fontFamily: "'JetBrains Mono', monospace",
      lineHeight: "1.4",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: cyan },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: cyanGlow },
    ".cm-activeLine": { backgroundColor: cyanDim },
    ".cm-gutters": {
      backgroundColor: bg,
      color: muted,
      border: "none",
      borderRight: `1px solid ${border}`,
    },
    ".cm-activeLineGutter": {
      backgroundColor: surfaceAlt,
      color: cyan,
    },
    ".cm-selectionMatch": { backgroundColor: cyanDim },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: cyanGlow,
      outline: `1px solid ${cyan}`,
    },
    ".cm-scroller": { fontFamily: "'JetBrains Mono', monospace" },
  },
  { dark: true },
);

const highlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: cyan },
  { tag: [t.controlKeyword, t.moduleKeyword], color: cyan },
  { tag: [t.string, t.special(t.string)], color: pink },
  { tag: [t.comment, t.lineComment, t.blockComment], color: muted, fontStyle: "italic" },
  { tag: [t.number, t.bool, t.null], color: pink },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: cyan },
  { tag: [t.definition(t.variableName), t.variableName], color: text },
  { tag: [t.propertyName, t.attributeName], color: cyan },
  { tag: [t.typeName, t.className, t.namespace], color: cyan },
  { tag: [t.operator, t.punctuation, t.bracket], color: text },
  { tag: [t.invalid], color: "#f87171" },
]);

// the full dark theme extension to pass as codemirror's `theme` prop.
export const vifrostDarkTheme: Extension = [
  editorTheme,
  syntaxHighlighting(highlightStyle),
];
