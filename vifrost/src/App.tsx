import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import type { Envelope, GameStartPayload } from './hooks/useWebSocket'
import { GameScreen } from './components/GameScreen'
import { Navbar } from './components/Navbar'
import './App.css'

const USERNAME_KEY = 'vifrost_username'
const MATCH_MODAL_DELAY_MS = 3000

type View = 'lobby' | 'in_game'

function App() {
  const joinWhenOpenRef = useRef(false)
  const gameDataRef = useRef<GameStartPayload | null>(null)
  const readyToEnterGameRef = useRef(false)
  const matchModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [view, setView] = useState<View>('lobby')
  const [gameData, setGameData] = useState<GameStartPayload | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [username, setUsernameState] = useState<string | null>(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(USERNAME_KEY) : null
  )

  const tryEnterGame = useCallback(() => {
    if (readyToEnterGameRef.current && gameDataRef.current) {
      setView('in_game')
    }
  }, [])

  const {
    status,
    lastMessage,
    connect,
    sendJoinQueue,
    isOpen,
  } = useWebSocket({
    connectImmediately: false,
    onMessage: useCallback((envelope: Envelope) => {
      if (envelope.type === 'match_found') {
        setShowMatchModal(true)
        if (matchModalTimerRef.current) clearTimeout(matchModalTimerRef.current)
        matchModalTimerRef.current = setTimeout(() => {
          matchModalTimerRef.current = null
          setShowMatchModal(false)
          readyToEnterGameRef.current = true
          tryEnterGame()
        }, MATCH_MODAL_DELAY_MS)
      }
      if (envelope.type === 'game_start' && envelope.payload) {
        const payload = envelope.payload as GameStartPayload
        gameDataRef.current = payload
        setGameData(payload)
        setEditorValue(payload.snippet)
        tryEnterGame()
      }
    }, [tryEnterGame]),
  })

  const setUsername = (name: string) => {
    setUsernameState(name)
    sessionStorage.setItem(USERNAME_KEY, name)
  }

  useEffect(() => {
    if (isOpen && joinWhenOpenRef.current) {
      sendJoinQueue()
      joinWhenOpenRef.current = false
    }
  }, [isOpen, sendJoinQueue])

  useEffect(() => {
    return () => {
      if (matchModalTimerRef.current) clearTimeout(matchModalTimerRef.current)
    }
  }, [])

  const handleNormalMode = () => {
    if (status === 'closed' || status === 'error') {
      joinWhenOpenRef.current = true
      connect()
    }
  }

  const normalModeDisabled = status === 'connecting' || !username

  if (view === 'in_game' && gameData) {
    return (
      <>
        <Navbar username={username} onUsernameSet={setUsername} />
        <main className="app app--game">
          <div className="game-page">
            {username && <p className="game-player-name">{username}</p>}
            <GameScreen
              value={editorValue}
              onChange={setEditorValue}
              vimMode
              height="400px"
              width="600px"
              theme="dark"
            />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar username={username} onUsernameSet={setUsername} />
      {showMatchModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Match found">
          <div className="modal match-modal">
            <p className="match-modal__text">Match found!</p>
          </div>
        </div>
      )}
      <main className="app">
        <div className="center-card">
          <button
            type="button"
            className="normal-mode-btn"
            onClick={handleNormalMode}
            disabled={normalModeDisabled}
          >
            {status === 'connecting' ? 'Connecting…' : 'Normal Mode'}
          </button>
          {!username && (
            <p className="hint">Login to play.</p>
          )}
          <p className="status">
            WS: <strong>{status}</strong>
            {lastMessage && (
              <> · Last: <strong>{lastMessage.type}</strong></>
            )}
          </p>
          {isOpen && (
            <p className="waiting">Waiting for a worthy opponent...</p>
          )}
        </div>
      </main>
    </>
  )
}

export default App
