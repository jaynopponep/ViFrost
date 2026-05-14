import { useState, useEffect, useCallback } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { GameScreen } from "../components/GameScreen";
import { Avatar } from "../components/Avatar";
import { useKeybindListener } from "../hooks/useKeybindListener";
import type {
  GameStartPayload,
  GameEndPayload,
  ScoreUpdateServerPayload,
  RunResultPayload,
  TestResult,
} from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./GamePage.css";

const SCORE_RULES = [
  { label: "+400", desc: "per test passed (first time)" },
  { label: "+20", desc: "navigation shortcuts (w, b, f{char}, {n}j)" },
  { label: "−5", desc: "cursor move in Normal mode" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, sendScoreUpdate, sendRunCode, lastMessage } =
    useOutletContext<AppOutletContext>();
  const gameData = location.state as GameStartPayload | null;

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? "");
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [runResults, setRunResults] = useState<TestResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(gameData?.duration ?? 120);
  const [gameResult, setGameResult] = useState<GameEndPayload | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showDesc, setShowDesc] = useState(true);

  const { attachVimModeListener, scoreExtension } = useKeybindListener(sendScoreUpdate);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "score_update") {
      const payload = lastMessage.payload as ScoreUpdateServerPayload;
      setPlayerScore(payload.myScore);
      setOpponentScore(payload.opponentScore);
    } else if (lastMessage.type === "run_result") {
      const payload = lastMessage.payload as RunResultPayload;
      setRunResults(payload.tests);
      setIsRunning(false);
    } else if (lastMessage.type === "timer_tick") {
      const payload = lastMessage.payload as { remaining: number };
      setTimeRemaining(payload.remaining);
    } else if (lastMessage.type === "game_end") {
      const payload = lastMessage.payload as GameEndPayload;
      setGameResult(payload);
    }
  }, [lastMessage]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    sendRunCode(editorValue);
  }, [sendRunCode, editorValue]);

  if (!gameData) {
    return <Navigate to="/" replace />;
  }

  const timerUrgent = timeRemaining <= 30;

  return (
    <main className="game">
      {/* Game-end overlay */}
      {gameResult && (
        <div className="game-end-overlay" role="dialog" aria-modal="true">
          <div className="game-end-modal">
            <h1
              className={`game-end-result ${
                gameResult.isWinner ? "game-end-result--win" : "game-end-result--lose"
              }`}
            >
              {gameResult.isWinner ? "YOU WIN!" : "YOU LOSE"}
            </h1>

            <p className="game-end-reason">
              {gameResult.reason === "opponent_left"
                ? "Your opponent disconnected."
                : gameResult.reason === "completion"
                ? gameResult.isWinner
                  ? "You passed all tests first!"
                  : "Your opponent passed all tests first."
                : "Time's up!"}
            </p>

            <div className="game-end-scores">
              <div className="game-end-score-row">
                <span className="game-end-score-name">You</span>
                <span className="game-end-score-val">{gameResult.score}</span>
              </div>
              <div className="game-end-score-row">
                <span className="game-end-score-name">Opponent</span>
                <span className="game-end-score-val">{gameResult.opponentScore}</span>
              </div>
            </div>

            <div className="game-end-actions">
              <button
                className="game-end-btn game-end-btn--primary"
                onClick={() => navigate("/lobby")}
              >
                Find New Match
              </button>
              <button
                className="game-end-btn game-end-btn--secondary"
                onClick={() => navigate("/")}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-arena">
        {/* Header row: player — timer/score — opponent */}
        <div className="game-arena-header">
          <div className="game-arena-header-player">
            {username && (
              <Avatar name={username} side="player" color={gameData.playerColor} />
            )}
          </div>

          <div className="game-header-center">
            <span className={`game-timer${timerUrgent ? " game-timer--urgent" : ""}`}>
              {formatTime(timeRemaining)}
            </span>
            <div className="game-score">
              <span className="game-score-label">SCORE</span>
              <span className="game-score-value">
                {playerScore} <span className="game-score-sep">—</span> {opponentScore}
              </span>
            </div>
          </div>

          <div className="game-arena-header-opponent">
            <Avatar
              name={gameData.opponentName || "Opponent"}
              side="opponent"
              color={gameData.opponentColor}
            />
          </div>
        </div>

        <div className="game-arena-screens">
          <div className="game-player-screen">
            {gameData.description && (
              <div className="game-desc">
                <button
                  className="game-desc-toggle"
                  onClick={() => setShowDesc((v) => !v)}
                >
                  <span className="game-desc-toggle-label">Problem</span>
                  <span className="game-desc-toggle-caret">{showDesc ? "▲" : "▼"}</span>
                </button>
                {showDesc && (
                  <p className="game-desc-text">{gameData.description}</p>
                )}
              </div>
            )}
            <GameScreen
              value={editorValue}
              onChange={setEditorValue}
              onCreateEditor={attachVimModeListener}
              vimMode
              height="400px"
              width="600px"
              theme="dark"
              extensions={scoreExtension}
            />
            <div className="game-player-footer">
              <div className="game-run-area">
                {runResults && (
                  <>
                    <div className="game-run-badges">
                      {runResults.map((tr, i) => (
                        <span
                          key={i}
                          className={`game-run-result game-run-result-${tr.passed ? "pass" : "fail"}`}
                        >
                          T{i + 1} {tr.passed ? "✓" : "✗"}
                        </span>
                      ))}
                    </div>
                    {runResults.some((tr) => !tr.passed) && (
                      <div className="game-run-details">
                        {runResults.map((tr, i) =>
                          tr.passed ? null : (
                            <div key={i} className="game-run-detail-row">
                              <span className="game-run-detail-label">T{i + 1}</span>
                              {tr.actual && (
                                <span className="game-run-detail-got">
                                  got <code className="game-run-detail-code">{tr.actual}</code>
                                </span>
                              )}
                              {tr.expected && (
                                <span className="game-run-detail-want">
                                  want <code className="game-run-detail-code">{tr.expected}</code>
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                className="game-rules-toggle"
                onClick={() => setShowRules((v) => !v)}
                title="Scoring rules"
              >
                ?
              </button>
              <button
                className="game-run-btn"
                onClick={handleRun}
                disabled={isRunning}
              >
                {isRunning ? "..." : "RUN"}
              </button>
            </div>

            {showRules && (
              <div className="game-rules-panel">
                <p className="game-rules-title">Scoring Rules</p>
                {SCORE_RULES.map((r) => (
                  <div key={r.label} className="game-rules-row">
                    <span className="game-rules-points">{r.label}</span>
                    <span className="game-rules-desc">{r.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="game-opponent-screen">
            <GameScreen
              value={gameData.snippet}
              readOnly
              vimMode={false}
              height="400px"
              width="600px"
              theme="dark"
            />
            <div className="game-opponent-overlay">
              <span className="game-opponent-overlay-text">OPPONENT</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
