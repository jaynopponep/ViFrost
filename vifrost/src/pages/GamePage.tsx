import { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { GameScreen } from "../components/GameScreen";
import { Avatar } from "../components/Avatar";
import type { GameStartPayload } from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./GamePage.css";

export function GamePage() {
  const location = useLocation();
  const { username } = useOutletContext<AppOutletContext>();
  const gameData = location.state as GameStartPayload | null;

  const [editorValue, setEditorValue] = useState(gameData?.snippet ?? "");

  if (!gameData) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="game">
      <div className="game-arena">
        <div className="game-panel">
          {username && (
            <Avatar
              name={username}
              side="player"
              color={gameData.playerColor}
            />
          )}
          <GameScreen
            value={editorValue}
            onChange={setEditorValue}
            vimMode
            height="400px"
            width="600px"
            theme="dark"
          />
        </div>

        <div className="game-panel">
          <div className="game-panel-opponent-header">
            <Avatar
              name={gameData.opponentName || "Opponent"}
              side="opponent"
              color={gameData.opponentColor}
            />
            :
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
