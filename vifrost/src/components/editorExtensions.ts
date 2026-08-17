import type { Extension } from '@codemirror/state'
import { python } from '@codemirror/lang-python'
import { indentUnit } from '@codemirror/language'
import { vim } from '@replit/codemirror-vim'

// snippets (server/code_snippets) are authored with 4-space indentation.
// codemirror's default indentUnit is 2 spaces, so python auto-indent on
// Enter lands below the surrounding lines ("indent slightly less than the
// previous line"). pin the unit to 4 spaces so auto-indent matches the
// snippet convention. shared so the regression test binds to the real
// editor config, not a re-derived copy.
export function buildEditorExtensions(
  vimMode: boolean,
  extraExtensions: Extension[] = [],
): Extension[] {
  const exts: Extension[] = [
    python(),
    indentUnit.of('    '),
    ...extraExtensions,
  ]
  if (vimMode) {
    exts.unshift(vim())
  }
  return exts
}
