import { useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { GameScreen } from '../components/GameScreen'
import type { GameStartPayload } from '../hooks/useWebSocket'
import type { AppOutletContext } from '../App'
import './GamePage.css'

export function GamePage() {
  const location = useLocation()
  const { username } = useOutletContext<AppOutletContext>()
  const gameData = location.state as GameStartPayload | null

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? '')

  if (!gameData) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="game">
      <div className="game__content">
        {username && <p className="game__player-name">{username}</p>}
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
  )
}
