import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import type { Envelope, GameStartPayload } from '../hooks/useWebSocket'
import type { AppOutletContext } from '../App'
import './LobbyPage.css'

const MATCH_MODAL_DELAY_MS = 3000

export function LobbyPage() {
  const navigate = useNavigate()
  const { username } = useOutletContext<AppOutletContext>()

  const joinWhenOpenRef = useRef(false)
  const gameDataRef = useRef<GameStartPayload | null>(null)
  const readyToEnterGameRef = useRef(false)
  const matchModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tryEnterGame = useCallback(() => {
    if (readyToEnterGameRef.current && gameDataRef.current) {
      navigate('/game', { state: gameDataRef.current })
    }
  }, [navigate])

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
        if (matchModalTimerRef.current) clearTimeout(matchModalTimerRef.current)
        matchModalTimerRef.current = setTimeout(() => {
          matchModalTimerRef.current = null
          readyToEnterGameRef.current = true
          tryEnterGame()
        }, MATCH_MODAL_DELAY_MS)
      }
      if (envelope.type === 'game_start' && envelope.payload) {
        const payload = envelope.payload as GameStartPayload
        gameDataRef.current = payload
        tryEnterGame()
      }
    }, [tryEnterGame]),
  })

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

  const handleJoinQueue = () => {
    if (status === 'closed' || status === 'error') {
      joinWhenOpenRef.current = true
      connect()
    }
  }

  const joinDisabled = status === 'connecting' || !username

  return (
    <>
      {status === 'open' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Match found">
          <div className="modal match-modal">
            <p className="match-modal__text">Match found!</p>
          </div>
        </div>
      )}
      <main className="lobby">
        <div className="lobby__card">
          <button
            type="button"
            className="lobby__join-btn"
            onClick={handleJoinQueue}
            disabled={joinDisabled}
          >
            {status === 'connecting' ? 'Connecting…' : 'Join Queue'}
          </button>
          {!username && (
            <p className="lobby__hint">Login to play.</p>
          )}
          <p className="lobby__status">
            WS: <strong>{status}</strong>
            {lastMessage && (
              <> · Last: <strong>{lastMessage.type}</strong></>
            )}
          </p>
          {isOpen && (
            <p className="lobby__waiting">Waiting for a worthy opponent...</p>
          )}
        </div>
      </main>
    </>
  )
}
