import { useCallback, useEffect, useRef, useState } from "react";
import { adaptServerEnvelope } from "./adaptServerEnvelope";
import type { KeybindEventKind } from "./vimPenalty";

export type Envelope<T = unknown> = {
  type: string;
  payload?: T;
};

export type GameStartPayload = {
  roomId: string;
  snippet: string;
  duration: number;
  opponentName: string;
  playerColor: string;
  opponentColor: string;
  problemTitle?: string;
  problemStatement?: string;
  totalTests?: number;
};

export type KeybindPayload = {
  keys: string;
  complex: boolean;
  penalty: boolean;
};

export type TimerTickPayload = {
  remaining: number;
};

export type GameEndPayload = {
  keybindsUsed?: KeybindPayload[];
  score: number;
  opponentScore: number;
  won: boolean;
  tied: boolean;
  keybindBonus: number;
  completionBonus: number;
  finishBonus: number;
  oppKeybindBonus: number;
  oppCompletionBonus: number;
  oppFinishBonus: number;
};

export type ScoreUpdateServerPayload = {
  myScore: number;
  opponentScore: number;
};

export type ErrorPayload = { message: string };

export type RunResultPayload = {
  results: boolean[];
  delta: number;
  // present when a run produced no results: syntax error, runtime traceback,
  // or timeout. display only.
  error?: string;
};

export type OpponentReadyPayload = Record<string, never>;

export type MatchCountdownPayload = {
  seconds: number;
};

export type MatchStartPayload = Record<string, never>;

export type OpponentRunResultPayload = {
  results: boolean[];
};

export type MatchEndPayload = {
  winner: "me" | "opponent";
  reason: "completed" | "forfeit";
  playerKeybindScore: number;
  opponentKeybindScore: number;
};

export type ServerMessage =
  | { type: "match_found"; payload: null }
  | { type: "game_start"; payload: GameStartPayload }
  | { type: "timer_tick"; payload: TimerTickPayload }
  | { type: "opponent_ready"; payload: OpponentReadyPayload }
  | { type: "match_countdown"; payload: MatchCountdownPayload }
  | { type: "match_start"; payload: MatchStartPayload }
  | { type: "run_result"; payload: RunResultPayload }
  | { type: "opponent_run_result"; payload: OpponentRunResultPayload }
  | { type: "score_update"; payload: ScoreUpdateServerPayload }
  | { type: "match_end"; payload: MatchEndPayload }
  | { type: "game_end"; payload: GameEndPayload }
  | { type: "error"; payload: ErrorPayload };

export type WebSocketStatus = "connecting" | "open" | "closed" | "error";

const DEFAULT_WS_URL = import.meta.env.VITE_SERVER_URL ?? `ws://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8080/ws`;

export interface UseWebSocketOptions {
  url?: string;
  onMessage?: (envelope: ServerMessage) => void;
  connectImmediately?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = DEFAULT_WS_URL,
    onMessage,
    connectImmediately = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("closed");
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    // bail if already open or still connecting. without the CONNECTING check a
    // rapid second call (double-clicked join, early reconnect) would create a
    // duplicate socket whose handlers also mutate shared state.
    const rs = wsRef.current?.readyState;
    if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) return;
    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus("open");
    ws.onclose = () => {
      setStatus("closed");
      wsRef.current = null;
    };
    ws.onerror = () => setStatus("error");

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string) as { type: string; payload?: unknown };
        const adapted = adaptServerEnvelope(raw);
        if (!adapted) return;
        setLastMessage(adapted);
        onMessageRef.current?.(adapted);
      } catch {
        setLastMessage({ type: "error", payload: { message: "Invalid JSON" } });
      }
    };
    // teardown is owned by the connectImmediately effect below; connect() is
    // called imperatively so a cleanup returned here would never run.
  }, [url]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("closed");
    setLastMessage(null);
  }, []);

  const send = useCallback((type: string, payload?: unknown) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type, payload: payload ?? null }));
  }, []);

  // all the websocket calls below
  const sendJoinQueue = useCallback(
    (username: string) => send("join_queue", { username }),
    [send],
  );
  // the client only reports which vim event happened. the server owns the
  // point values, so this cannot inject a score (see server/scoring_events.go).
  const sendKeybindEvent = useCallback(
    (kind: KeybindEventKind, count = 1) =>
      send("keybind_event", { kind, count }),
    [send],
  );
  const sendRunCode = useCallback(
    (code: string) => send("run_code", { code }),
    [send],
  );
  const sendReady = useCallback(() => send("player_ready", {}), [send]);
  const sendSubmit = useCallback(() => send("submit"), [send]);
  const sendPing = useCallback(() => send("ping"), [send]);
  const sendLeave = useCallback(() => send("leave"), [send]);

  useEffect(() => {
    if (connectImmediately) connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connectImmediately, connect]);

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    send,
    sendJoinQueue,
    sendKeybindEvent,
    sendRunCode,
    sendReady,
    sendSubmit,
    sendPing,
    sendLeave,
    isOpen: status === "open",
  };
}
