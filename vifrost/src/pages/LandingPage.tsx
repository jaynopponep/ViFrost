import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const DIFFICULTIES = ['beginner', 'easy', 'medium', 'hard', 'pro'] as const
type Difficulty = (typeof DIFFICULTIES)[number]

export function LandingPage() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  const handlePlay = (mode: 'casual' | 'ranked') => {
    navigate('/lobby', { state: { mode, difficulty } })
  }

  return (
    <main className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <h1 className="landing-title">ViFrost</h1>
        <p className="landing-tagline">Race to debug. Prove your Vim mastery.</p>
        <p className="landing-desc">
          A real-time 1v1 competitive coding arena. You and an opponent get the
          same broken Python snippet — first to pass all tests wins. Catch:
          you can only use <strong>Vim keybindings</strong>.
        </p>
      </section>

      {/* Feature highlights */}
      <section className="landing-features">
        <div className="landing-feature">
          <span className="landing-feature-icon">⌨</span>
          <h3 className="landing-feature-title">Vim Powered</h3>
          <p className="landing-feature-desc">
            Navigate and edit in Normal, Insert, and Visual mode.
            Your Vim efficiency is part of the score.
          </p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-icon">⚡</span>
          <h3 className="landing-feature-title">Live 1v1 Matches</h3>
          <p className="landing-feature-desc">
            Matched against a real opponent in seconds. Watch the 2-minute
            clock — every keystroke counts.
          </p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-icon">🏆</span>
          <h3 className="landing-feature-title">Score to Win</h3>
          <p className="landing-feature-desc">
            +400 pts per test passed. Complex Vim moves earn bonus points.
            Cursor jumps in Normal mode cost you.
          </p>
        </div>
      </section>

      {/* How to play */}
      <section className="landing-how">
        <h2 className="landing-how-title">How to Play</h2>
        <ol className="landing-steps">
          <li className="landing-step">
            <span className="landing-step-num">1</span>
            <span>Pick a difficulty and join the queue.</span>
          </li>
          <li className="landing-step">
            <span className="landing-step-num">2</span>
            <span>Get matched with an opponent and receive a buggy Python snippet.</span>
          </li>
          <li className="landing-step">
            <span className="landing-step-num">3</span>
            <span>Fix the code using Vim. Press RUN to test. First to pass all tests wins.</span>
          </li>
        </ol>
      </section>

      {/* Difficulty selector */}
      <section className="landing-difficulty">
        <h3 className="landing-difficulty-label">Difficulty</h3>
        <div className="landing-diff-buttons">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`landing-diff-btn${difficulty === d ? ' landing-diff-btn--active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Play buttons */}
      <div className="landing-play-buttons">
        <button
          type="button"
          className="landing-play-btn landing-play-btn--casual"
          onClick={() => handlePlay('casual')}
        >
          Casual
        </button>
        <button
          type="button"
          className="landing-play-btn landing-play-btn--ranked"
          onClick={() => handlePlay('ranked')}
        >
          Ranked
        </button>
      </div>

      {/* Tutorial link */}
      <p className="landing-tutorial-link">
        New to Vim?{' '}
        <button
          type="button"
          className="landing-tutorial-btn"
          onClick={() => navigate('/tutorial')}
        >
          Try the Tutorial
        </button>
      </p>
    </main>
  )
}
