import { useNavigate } from 'react-router-dom'
import { GameSelectionButton } from '../components/GameSelectionButton'
import './LandingPage.css'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="landing">
      <div className="landing__buttons">
        <GameSelectionButton label="Casual" onClick={() => navigate('/lobby')} />
        <GameSelectionButton label="Ranked" onClick={() => navigate('/lobby')} />
      </div>
    </main>
  )
}
