import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { EditorView } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import { GameScreen } from "../components/GameScreen";
import { Avatar } from "../components/Avatar";
import type {
  GameStartPayload,
  ScoreUpdateServerPayload,
  RunResultPayload,
} from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./GamePage.css";

const SCORE_NORMAL_MODE_EDIT = -5;
const SCORE_NAV_SHORTCUT = 25; // net +20 due to movement penalty

type VimModeChangeEvent = { mode: string };
type VimCm = {
  on(event: "vim-mode-change", h: (e: VimModeChangeEvent) => void): void;
};
type EditorViewWithVim = EditorView & { cm?: VimCm };

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

  const sendScoreUpdateRef = useRef(sendScoreUpdate);
  sendScoreUpdateRef.current = sendScoreUpdate;
  const vimModeRef = useRef<string>("normal");
  const keyBufferRef = useRef<string>("");
  // below's currently used for comparing cursor positions
  // post-vim keybind. e.g. "fx" to find x, if cursor actually moved
  // then +20 net points are awarded. otherwise, no movement, no points.
  const fNavPendingRef = useRef<number | null>(null);

  const attachVimModeListener = useCallback((view: EditorViewWithVim) => {
    view.cm?.on("vim-mode-change", (e) => {
      vimModeRef.current = e.mode;
      keyBufferRef.current = "";
      fNavPendingRef.current = null;
    });

    view.dom.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        if (vimModeRef.current !== "normal") return;

        // key vs. buffer (buf)
        // buf -> what's actually been "pressed so far"
        // key -> current key pressed
        const key = event.key;
        const buf = keyBufferRef.current;

        if (buf === "f") {
          if (key.length === 1) {
            // +20 net points awarded through useMemo event listener down below
            fNavPendingRef.current = view.state.selection.main.head;
          }
          keyBufferRef.current = "";
          return;
        }

        fNavPendingRef.current = null;

        if (key === "f" && buf === "") {
          keyBufferRef.current = "f";
          return;
        }

        if (key === "w" || key === "b") {
          sendScoreUpdateRef.current(SCORE_NAV_SHORTCUT);
          keyBufferRef.current = "";
          return;
        }

        if (/^\d$/.test(key)) {
          keyBufferRef.current = buf + key;
          return;
        }

        // {n}j — only awards when a numeric count is present
        if (key === "j" && /^\d+$/.test(buf)) {
          sendScoreUpdateRef.current(SCORE_NAV_SHORTCUT);
          keyBufferRef.current = "";
          return;
        }

        keyBufferRef.current = "";
      },
      { capture: true },
    );
  }, []);

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

  const onEditorUpdate = useCallback((update: ViewUpdate) => {
    if (vimModeRef.current === "insert") return;

    // f{char} verification: cursor must have moved for the point to count
    if (fNavPendingRef.current !== null) {
      const prevPos = fNavPendingRef.current;
      fNavPendingRef.current = null;
      if (update.state.selection.main.head !== prevPos) {
        sendScoreUpdateRef.current(SCORE_NAV_SHORTCUT);
      }
      return;
    }

    if (update.selectionSet || update.docChanged) {
      sendScoreUpdateRef.current(SCORE_NORMAL_MODE_EDIT);
    }
  }, []);

  const scoreExtension = useMemo(
    () => [EditorView.updateListener.of(onEditorUpdate)],
    [onEditorUpdate],
  );

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
