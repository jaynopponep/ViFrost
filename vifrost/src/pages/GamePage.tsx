import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { EditorView } from "@codemirror/view";
import { GameScreen } from "../components/GameScreen";
import { Avatar } from "../components/Avatar";
import type { GameStartPayload, ScoreUpdateServerPayload } from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./GamePage.css";

export function GamePage() {
  const location = useLocation();
  const { username, sendScoreUpdate, lastMessage } = useOutletContext<AppOutletContext>();
  const gameData = location.state as GameStartPayload | null;

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? "");
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const sendScoreUpdateRef = useRef(sendScoreUpdate);
  sendScoreUpdateRef.current = sendScoreUpdate;

  useEffect(() => {
    if (lastMessage?.type === "score_update") {
      const payload = lastMessage.payload as ScoreUpdateServerPayload;
      setPlayerScore(payload.myScore);
      setOpponentScore(payload.opponentScore);
    }
  }, [lastMessage]);

  const scoreExtension = useMemo(
    () => [
      EditorView.updateListener.of((update) => {
        if (update.selectionSet || update.docChanged) {
          sendScoreUpdateRef.current(-10);
        }
      }),
    ],
    [],
  );

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
          <GameScreen
            value={editorValue}
            onChange={setEditorValue}
            vimMode
            height="400px"
            width="600px"
            theme="dark"
            extensions={scoreExtension}
          />
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
