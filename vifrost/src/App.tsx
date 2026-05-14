import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { useWebSocket } from './hooks/useWebSocket'
import type { Envelope, WebSocketStatus } from './hooks/useWebSocket'

const USERNAME_KEY = 'vifrost_username'

export interface AppOutletContext {
  username: string | null
  setUsername: (name: string) => void
  wsStatus: WebSocketStatus
  connectWs: () => void
  isWsOpen: boolean
  sendJoinQueue: (username: string) => void
  sendPlayerReady: () => void
  sendScoreUpdate: (delta: number) => void
  sendRunCode: (code: string) => void
  lastMessage: Envelope | null
}

function App() {
  const [username, setUsernameState] = useState<string | null>(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(USERNAME_KEY) : null
  )

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
      <Navbar username={username} onUsernameSet={setUsername} onLogout={clearUsername} />
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
