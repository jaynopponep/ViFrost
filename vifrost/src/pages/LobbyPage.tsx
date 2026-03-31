import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import type { Envelope, GameStartPayload } from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./LobbyPage.css";
import hintData from "../data/hints.json";

interface Hint {
  id: number;
  title: string;
}

const MATCH_MODAL_DELAY_MS = 3000;

export function LobbyPage() {
  const navigate = useNavigate();
  const { username } = useOutletContext<AppOutletContext>();

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

  const { status, lastMessage, connect, sendJoinQueue, isOpen } = useWebSocket({
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
      <main className="lobby">
        <div className="lobby-card">
          <button
            type="button"
            className="lobby-join-button"
            onClick={handleJoinQueue}
            disabled={joinDisabled}
          >
            {status === "connecting" ? "Connecting…" : "Join Queue"}
          </button>
          {!username && <p className="lobby-hint">Login to play.</p>}
          <p className="lobby-status">
            WS: <strong>{status}</strong>
            {lastMessage && (
              <>
                {" "}
                · Last: <strong>{lastMessage.type}</strong>
              </>
            )}
          </p>
          {isOpen && (
            <p className="lobby-waiting">Waiting for a worthy opponent...</p>
          )}
        </div>
        <div className="hint">
          <h1 className="hint-text" onAnimationIteration={pickHint}>
            {hint ? formatHint(hint.title) : ""}
          </h1>
        </div>
      </main>
    </>
  );
}
