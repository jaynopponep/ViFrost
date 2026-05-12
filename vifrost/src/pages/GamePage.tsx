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
} from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./GamePage.css";

export function GamePage() {
  const location = useLocation();
  const { username, sendScoreUpdate, sendRunCode, lastMessage } =
    useOutletContext<AppOutletContext>();
  const gameData = location.state as GameStartPayload | null;

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? "");
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [runResults, setRunResults] = useState<boolean[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

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
    }
  }, [lastMessage]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    sendRunCode(editorValue);
  }, [sendRunCode, editorValue]);

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
              />
            )}
          </div>
          <div className="game-score">
            <span className="game-score-label">SCORE</span>
            <span className="game-score-value">
              {playerScore} - {opponentScore}
            </span>
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
                disabled={isRunning}
              >
                {isRunning ? "..." : "RUN"}
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
