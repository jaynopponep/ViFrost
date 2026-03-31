import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import type { Envelope, GameStartPayload } from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./LobbyPage.css";
import hintData from "../data/hints.json";
import { animationFrames } from "../data/animationFrames";

interface Hint {
  id: number;
  title: string;
}

const MATCH_MODAL_DELAY_MS = 3000;

export function LobbyPage() {
  const navigate = useNavigate();
  const { username } = useOutletContext<AppOutletContext>();

  // hint rotation
  const [hint, setHint] = useState<Hint | null>(null);

  const pickHint = () => {
    const randomIdx = Math.floor(Math.random() * hintData.length);
    setHint(hintData[randomIdx]);
  };

  const formatHint = (hint: string) => {
    return "Hint: " + hint;
  };

  useEffect(() => {
    pickHint();
  }, []);

  // ascii animation at 30fps
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % animationFrames.length);
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, []);

  // match found state for modal
  const [matchFound, setMatchFound] = useState(false);
  const joinWhenOpenRef = useRef(false);
  const gameDataRef = useRef<GameStartPayload | null>(null);
  const readyToEnterGameRef = useRef(false);
  const matchModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tryEnterGame = useCallback(() => {
    if (readyToEnterGameRef.current && gameDataRef.current) {
      navigate("/game", { state: gameDataRef.current });
    }
  }, [navigate]);

  const { status, connect, sendJoinQueue, isOpen } = useWebSocket({
    connectImmediately: false,
    onMessage: useCallback(
      (envelope: Envelope) => {
        if (envelope.type === "match_found") {
          setMatchFound(true);
          if (matchModalTimerRef.current)
            clearTimeout(matchModalTimerRef.current);
          matchModalTimerRef.current = setTimeout(() => {
            matchModalTimerRef.current = null;
            readyToEnterGameRef.current = true;
            tryEnterGame();
          }, MATCH_MODAL_DELAY_MS);
        }
        if (envelope.type === "game_start" && envelope.payload) {
          const payload = envelope.payload as GameStartPayload;
          gameDataRef.current = payload;
          tryEnterGame();
        }
      },
      [tryEnterGame],
    ),
  });

  useEffect(() => {
    if (isOpen && joinWhenOpenRef.current) {
      sendJoinQueue(username!);
      joinWhenOpenRef.current = false;
    }
  }, [isOpen, sendJoinQueue, username]);

  useEffect(() => {
    return () => {
      if (matchModalTimerRef.current) clearTimeout(matchModalTimerRef.current);
    };
  }, []);

  const handleJoinQueue = () => {
    if (status === "closed" || status === "error") {
      joinWhenOpenRef.current = true;
      connect();
    }
  };

  const joinDisabled = status === "connecting" || !username;

  return (
    <>
      {matchFound && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Match found"
        >
          <div className="modal match-modal">
            <p className="match-modal-text">Match found!</p>
          </div>
        </div>
      )}

      <main className="lobby-layout">
        {/* left panel: spinner, status, queue stats */}
        <section className="lobby-panel lobby-panel--left">
          <div className="lobby-status-block">
            <div className="lobby-spinner-wrap">
              <div className="lobby-spinner">
                <div className="lobby-spinner__track lobby-spinner__track--outer"></div>
                <div className="lobby-spinner__arc lobby-spinner__arc--outer"></div>
                <div className="lobby-spinner__track lobby-spinner__track--mid"></div>
                <div className="lobby-spinner__arc lobby-spinner__arc--mid"></div>
                <div className="lobby-spinner__core"></div>
              </div>
            </div>

            {isOpen ? (
              <>
                <h1 className="lobby-finding-text">
                  Finding match
                  <span className="lobby-dots">
                    <span className="lobby-dot">.</span>
                    <span className="lobby-dot">.</span>
                    <span className="lobby-dot">.</span>
                  </span>
                </h1>
                <p className="lobby-status-sub">Searching for an opponent</p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="lobby-join-btn"
                  onClick={handleJoinQueue}
                  disabled={joinDisabled}
                >
                  {status === "connecting" ? "Connecting..." : "Join Queue"}
                </button>
                {!username && (
                  <p className="lobby-login-hint">Login to play.</p>
                )}
              </>
            )}

            <div className="lobby-divider"></div>

            {/* queue stats, values will come from websocket later */}
            <ul className="lobby-queue-stats">
              <li className="lobby-queue-stats__row">
                <span className="lobby-queue-stats__label">Players online</span>
                <span className="lobby-queue-stats__value">-</span>
              </li>
              <li className="lobby-queue-stats__row">
                <span className="lobby-queue-stats__label">In queue</span>
                <span className="lobby-queue-stats__value">-</span>
              </li>
              <li className="lobby-queue-stats__row">
                <span className="lobby-queue-stats__label">Avg. wait</span>
                <span className="lobby-queue-stats__value">-</span>
              </li>
            </ul>
          </div>
        </section>

        {/* right panel: ascii penguin animation */}
        <section className="lobby-panel lobby-panel--right">
          <pre className="lobby-ascii">{animationFrames[frame]}</pre>
        </section>

        {/* hint bar spanning bottom */}
        <div className="hint">
          <h1 className="hint-text" onAnimationIteration={pickHint}>
            {hint ? formatHint(hint.title) : ""}
          </h1>
        </div>
      </main>
    </>
  );
}
