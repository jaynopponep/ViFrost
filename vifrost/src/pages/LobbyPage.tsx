import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import type { Envelope, GameStartPayload, QueueStatsPayload } from "../hooks/useWebSocket";
import type { AppOutletContext } from "../App";
import "./LobbyPage.css";
import hintData from "../data/hints.json";
import { animationFrames } from "../data/animationFrames";
import { Loader } from "../components/ui/loader";

interface Hint {
  id: number;
  title: string;
}

const MATCH_MODAL_DELAY_MS = 3000;

export function LobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = (location.state as { mode?: string }) || {};

  const {
    username,
    wsStatus,
    connectWs,
    sendJoinQueue,
    sendPlayerReady,
    isWsOpen,
    lastMessage,
  } = useOutletContext<AppOutletContext>();

  // ── hint rotation ──────────────────────────────────────────────────────────
  const [hint, setHint] = useState<Hint | null>(null);
  const pickHint = () => setHint(hintData[Math.floor(Math.random() * hintData.length)]);
  useEffect(() => { pickHint(); }, []);

  // ── ascii animation at 30 fps ──────────────────────────────────────────────
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((p) => (p + 1) % animationFrames.length), 1000 / 30);
    return () => clearInterval(id);
  }, []);

  // ── queue stats (live from server) ────────────────────────────────────────
  const [queueStats, setQueueStats] = useState<QueueStatsPayload>({ playersOnline: 0, inQueue: 0 });

  // ── match flow ────────────────────────────────────────────────────────────
  const [matchFound, setMatchFound] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const gameDataRef = useRef<GameStartPayload | null>(null);
  const readyToEnterGameRef = useRef(false);
  const matchModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinWhenOpenRef = useRef(false);
  // Snapshot the message present when we mount so we don't process it as a new match.
  const mountMessageRef = useRef(lastMessage);

  const tryEnterGame = useCallback(() => {
    if (readyToEnterGameRef.current && gameDataRef.current) {
      navigate("/game", { state: gameDataRef.current });
    }
  }, [navigate]);

  // ── auto-join on mount ────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!username) return;
    if (isWsOpen) {
      sendJoinQueue(username);
      setInQueue(true);
    } else {
      joinWhenOpenRef.current = true;
      if (wsStatus === "closed" || wsStatus === "error") connectWs();
    }
  }, []); // intentionally empty — run once on mount

  // When the WS opens after the mount effect set the flag, join then.
  useEffect(() => {
    if (isWsOpen && joinWhenOpenRef.current && username) {
      joinWhenOpenRef.current = false;
      sendJoinQueue(username);
      setInQueue(true);
    }
  }, [isWsOpen, sendJoinQueue, username]);

  // ── incoming WS messages ──────────────────────────────────────────────────
  useEffect(() => {
    if (!lastMessage || lastMessage === mountMessageRef.current) return;
    const envelope = lastMessage as Envelope;

    if (envelope.type === "match_found") {
      setMatchFound(true);
      sendPlayerReady();
      if (matchModalTimerRef.current) clearTimeout(matchModalTimerRef.current);
      matchModalTimerRef.current = setTimeout(() => {
        matchModalTimerRef.current = null;
        readyToEnterGameRef.current = true;
        tryEnterGame();
      }, MATCH_MODAL_DELAY_MS);
    }

    if (envelope.type === "game_start" && envelope.payload) {
      gameDataRef.current = envelope.payload as GameStartPayload;
      tryEnterGame();
    }

    if (envelope.type === "queue_stats" && envelope.payload) {
      setQueueStats(envelope.payload as QueueStatsPayload);
    }
  }, [lastMessage, tryEnterGame, sendPlayerReady]);

  useEffect(() => () => {
    if (matchModalTimerRef.current) clearTimeout(matchModalTimerRef.current);
  }, []);

  // ── manual join (fallback) ────────────────────────────────────────────────
  const handleJoinQueue = () => {
    if (!username) return;
    if (isWsOpen) {
      sendJoinQueue(username);
      setInQueue(true);
    } else {
      joinWhenOpenRef.current = true;
      if (wsStatus === "closed" || wsStatus === "error") connectWs();
    }
  };

  const modeLabel = mode === "ranked" ? "Ranked" : "Casual";
  const showFinding = inQueue || isWsOpen;

  return (
    <>
      {matchFound && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Match found">
          <div className="modal match-modal">
            <p className="match-modal-text">Match found!</p>
          </div>
        </div>
      )}

      <main className="lobby-layout">
        {/* left panel: spinner, status, queue stats */}
        <section className="lobby-panel lobby-panel--left">
          <div className="lobby-status-block">
            <Loader />

            {showFinding ? (
              <div className="lobby-finding-group">
                <h1 className="lobby-finding-text">
                  Finding match
                  <span className="lobby-dots">
                    <span className="lobby-dot">.</span>
                    <span className="lobby-dot">.</span>
                    <span className="lobby-dot">.</span>
                  </span>
                </h1>
                <p className="lobby-status-sub">{modeLabel}</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="lobby-join-btn"
                  onClick={handleJoinQueue}
                  disabled={wsStatus === "connecting" || !username}
                >
                  {wsStatus === "connecting" ? "Connecting..." : "Join Queue"}
                </button>
                {!username && <p className="lobby-login-hint">Login to play.</p>}
              </>
            )}

            <div className="lobby-divider" />

            <ul className="lobby-queue-stats">
              <li className="lobby-queue-stats__row">
                <span className="lobby-queue-stats__label">Players online</span>
                <span className="lobby-queue-stats__value">
                  {queueStats.playersOnline > 0 ? queueStats.playersOnline : "—"}
                </span>
              </li>
              <li className="lobby-queue-stats__row">
                <span className="lobby-queue-stats__label">In queue</span>
                <span className="lobby-queue-stats__value">
                  {queueStats.inQueue > 0 ? queueStats.inQueue : "—"}
                </span>
              </li>
              <li className="lobby-queue-stats__row">
                <span className="lobby-queue-stats__label">Avg. wait</span>
                <span className="lobby-queue-stats__value">
                  {queueStats.inQueue >= 2 ? "< 5s" : queueStats.inQueue === 1 ? "waiting..." : "—"}
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* right panel: ascii animation */}
        <section className="lobby-panel lobby-panel--right">
          <pre className="lobby-ascii">{animationFrames[frame]}</pre>
        </section>

        {/* hint bar spanning bottom */}
        <div className="hint">
          <h1 className="hint-text" onAnimationIteration={pickHint}>
            {hint ? `Hint: ${hint.title}` : ""}
          </h1>
        </div>
      </main>
    </>
  );
}
