import type { Extension } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { vim } from '@replit/codemirror-vim'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'

export interface GameScreenProps {
  value?: string
  onChange?: (value: string) => void
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
      javascript(),
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
      height={height}
      width={width}
      theme={theme}
      basicSetup={true}
      editable={!readOnly}
      readOnly={readOnly}
      placeholder={placeholder}
      extensions={extensions}
    />
  )
}

export default GameScreen
