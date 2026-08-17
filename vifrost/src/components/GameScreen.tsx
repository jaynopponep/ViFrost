import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { lineNumbersRelative } from '@uiw/codemirror-extensions-line-numbers-relative'
import { useMemo } from 'react'
import { buildEditorExtensions } from './editorExtensions'

export interface GameScreenProps {
  value?: string
  onChange?: (value: string) => void
  onCreateEditor?: (view: EditorView) => void
  vimMode?: boolean
  readOnly?: boolean
  placeholder?: string
  height: string
  width: string
  theme?: 'light' | 'dark' | Extension
  extensions?: Extension[]
}

export function GameScreen({
  value = '',
  onChange,
  onCreateEditor,
  vimMode = true,
  readOnly = false,
  placeholder = '',
  height,
  width,
  theme = 'dark',
  extensions: extraExtensions = [],
}: GameScreenProps) {
  const extensions = useMemo(
    () => buildEditorExtensions(vimMode, extraExtensions),
    [vimMode, extraExtensions],
  )

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onCreateEditor={onCreateEditor}
      height={height}
      width={width}
      theme={theme}
      basicSetup={{ lineNumbers: false }}
      editable={!readOnly}
      readOnly={readOnly}
      placeholder={placeholder}
      extensions={[lineNumbersRelative, ...extensions]}
    />
  )
}

export default GameScreen
