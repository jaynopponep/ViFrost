import { useEffect, useRef } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import './App.css'

function App() {
  const joinWhenOpenRef = useRef(false)

  const {
    status,
    lastMessage,
    connect,
    sendJoinQueue,
    isOpen,
  } = useWebSocket({
    connectImmediately: false,
  })

  useEffect(() => {
    if (isOpen && joinWhenOpenRef.current) {
      sendJoinQueue()
      joinWhenOpenRef.current = false
    }
  }, [isOpen, sendJoinQueue])

  const handleNormalMode = () => {
    if (status === 'closed' || status === 'error') {
      joinWhenOpenRef.current = true
      connect()
    }
  }

  return (
    <main className="app">
      <div className="center-card">
        <button
          type="button"
          className="normal-mode-btn"
          onClick={handleNormalMode}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? 'Connecting…' : 'Normal Mode'}
        </button>
        <p className="status">
          WS: <strong>{status}</strong>
          {lastMessage && (
            <> · Last: <strong>{lastMessage.type}</strong></>
          )}
        </p>
        {isOpen && (
          <p className="waiting">In queue — open another browser/tab and click to match.</p>
        )}
      </div>
    </main>
  )
}

export default App
