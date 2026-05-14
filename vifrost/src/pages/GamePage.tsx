import { useState, useEffect, useCallback } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { GameScreen } from "../components/GameScreen";
import { Avatar } from "../components/Avatar";
import { useKeybindListener } from "../hooks/useKeybindListener";
import type {
  GameStartPayload,
  ScoreUpdateServerPayload,
  RunResultPayload,
  TimerTickPayload,
  GameEndPayload,
} from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./GamePage.css";

export function GamePage() {
  const location = useLocation();
  const { username, sendScoreUpdate, sendRunCode, sendSubmit, lastMessage } =
    useOutletContext<AppOutletContext>();
  const gameData = location.state as GameStartPayload | null;

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? "");
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [runResults, setRunResults] = useState<boolean[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(gameData?.duration ?? 120);
  const [gameResult, setGameResult] = useState<"win" | "lose" | "tie" | null>(null);

  const { attachVimModeListener, scoreExtension } = useKeybindListener(sendScoreUpdate);

  useEffect(() => {
    if (lastMessage?.type === "score_update") {
      const payload = lastMessage.payload as ScoreUpdateServerPayload;
      setPlayerScore(payload.myScore);
      setOpponentScore(payload.opponentScore);
    } else if (lastMessage?.type === "run_result") {
      const payload = lastMessage.payload as RunResultPayload;
      setRunResults(payload.results);
      setIsRunning(false);
    } else if (lastMessage?.type === "timer_tick") {
      const payload = lastMessage.payload as TimerTickPayload;
      setTimeLeft(payload.remaining);
    } else if (lastMessage?.type === "game_end") {
      const payload = lastMessage.payload as GameEndPayload;
      setGameResult(payload.tied ? "tie" : payload.won ? "win" : "lose");
    }
  }, [lastMessage]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    sendRunCode(editorValue);
  }, [sendRunCode, editorValue]);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
    sendSubmit();
  }, [sendSubmit]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (!gameData) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="game">
      <div className="game-arena">
        <div className="game-arena-header">
          <div className="game-arena-header-player">
            {username && (
              <Avatar
                name={username}
                side="player"
                color={gameData.playerColor}
                result={gameResult}
              />
            )}
          </div>
          <div className="game-arena-header-center">
            <div className={`game-timer${timeLeft <= 12 ? " game-timer-urgent" : ""}`}>
              <span className="game-timer-dot" />
              <span className="game-timer-value">{formatTime(timeLeft)}</span>
            </div>
            <div className="game-score">
              <span className="game-score-label">SCORE</span>
              <span className="game-score-value">
                {playerScore} - {opponentScore}
              </span>
            </div>
          </div>
          <div className="game-arena-header-opponent">
            <Avatar
              name={gameData.opponentName || "Opponent"}
              side="opponent"
              color={gameData.opponentColor}
              result={gameResult === "tie" ? "tie" : gameResult === "win" ? "lose" : gameResult === "lose" ? "win" : null}
            />
          </div>
        </div>

        <div className="game-arena-screens">
          <div className="game-player-screen">
            <GameScreen
              value={editorValue}
              onChange={setEditorValue}
              onCreateEditor={attachVimModeListener}
              vimMode
              readOnly={isSubmitted}
              height="400px"
              width="600px"
              theme="dark"
              extensions={scoreExtension}
            />
            <div className="game-player-footer">
              {runResults && (
                <div className="game-run-results">
                  {runResults.map((passed, i) => (
                    <span
                      key={i}
                      className={`game-run-result game-run-result-${passed ? "pass" : "fail"}`}
                    >
                      T{i + 1} {passed ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
              )}
              <button
                className="game-run-btn"
                onClick={handleRun}
                disabled={isRunning || isSubmitted}
              >
                {isRunning ? "..." : "RUN"}
              </button>
              <button
                className="game-submit-btn"
                onClick={handleSubmit}
                disabled={isSubmitted}
              >
                SUBMIT
              </button>
            </div>
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
