import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { python } from '@codemirror/lang-python'
import { vim } from '@replit/codemirror-vim'
import CodeMirror from '@uiw/react-codemirror'
import { lineNumbersRelative } from '@uiw/codemirror-extensions-line-numbers-relative'
import { useMemo } from 'react'

export interface GameScreenProps {
  value?: string
  onChange?: (value: string) => void
  onCreateEditor?: (view: EditorView) => void
  vimMode?: boolean
  readOnly?: boolean
  placeholder?: string
  height: string
  width: string
  theme?: 'light' | 'dark'
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
  const extensions = useMemo(() => {
    const exts: Extension[] = [
      python(),
      ...extraExtensions,
    ]
    if (vimMode) {
      exts.unshift(vim())
    }
    return exts
  }, [vimMode, extraExtensions])

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
