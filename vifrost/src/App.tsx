import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { useWebSocket } from './hooks/useWebSocket'
import { lightPalette, darkPalette } from './theme/theme'
import type { Envelope, WebSocketStatus } from './hooks/useWebSocket'

const USERNAME_KEY = 'vifrost_username'
const THEME_KEY = 'vifrost_theme'

export type AppTheme = 'dark' | 'light'

export interface AppOutletContext {
  username: string | null
  setUsername: (name: string) => void
  wsStatus: WebSocketStatus
  connectWs: () => void
  isWsOpen: boolean
  sendJoinQueue: (username: string, difficulty?: string) => void
  sendPlayerReady: () => void
  sendScoreUpdate: (delta: number) => void
  sendRunCode: (code: string) => void
  lastMessage: Envelope | null
}

function App() {
  const [username, setUsernameState] = useState<string | null>(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(USERNAME_KEY) : null
  )

  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const pal = theme === 'dark' ? darkPalette : lightPalette
    for (const [key, val] of Object.entries(pal)) {
      document.documentElement.style.setProperty(`--${key}`, val)
    }
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

  const setUsername = (name: string) => {
    setUsernameState(name)
    sessionStorage.setItem(USERNAME_KEY, name)
  }

  const clearUsername = () => {
    setUsernameState(null)
    sessionStorage.removeItem(USERNAME_KEY)
  }

  const { status, lastMessage, connect, sendJoinQueue, sendPlayerReady, sendScoreUpdate, sendRunCode } = useWebSocket({
    connectImmediately: false,
  })

  return (
    <>
      <Navbar
        username={username}
        onUsernameSet={setUsername}
        onLogout={clearUsername}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <Outlet
        context={
          {
            username,
            setUsername,
            wsStatus: status,
            connectWs: connect,
            isWsOpen: status === 'open',
            sendJoinQueue,
            sendPlayerReady,
            sendScoreUpdate,
            sendRunCode,
            lastMessage,
          } satisfies AppOutletContext
        }
      />
    </>
  )
}

export default App
