import { useCallback, useEffect, useRef, useState } from "react";

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
};

export type WebSocketStatus = "connecting" | "open" | "closed" | "error";

const DEFAULT_WS_URL = import.meta.env.VITE_SERVER_URL ?? `ws://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8080/ws`;

export interface UseWebSocketOptions {
  url?: string;
  onMessage?: (envelope: Envelope) => void;
  connectImmediately?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = DEFAULT_WS_URL,
    onMessage,
    connectImmediately = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("closed");
  const [lastMessage, setLastMessage] = useState<Envelope | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
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
        const envelope = JSON.parse(event.data as string) as Envelope;
        setLastMessage(envelope);
        onMessageRef.current?.(envelope);
      } catch {
        setLastMessage({ type: "error", payload: { message: "Invalid JSON" } });
      }
    };

    return () => {
      ws.close();
    };
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

  // ALL the websocket calls below
  const sendJoinQueue = useCallback(
    (username: string) => send("join_queue", { username }),
    [send],
  );
  const sendKeybind = useCallback(
    (payload: KeybindPayload) => send("keybind", payload),
    [send],
  );
  const sendScoreUpdate = useCallback(
    (delta: number, keybindDelta = 0) =>
      send("score_update", { delta, keybindDelta }),
    [send],
  );
  const sendRunCode = useCallback(
    (code: string) => send("run_code", { code }),
    [send],
  );
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
    sendKeybind,
    sendScoreUpdate,
    sendRunCode,
    sendSubmit,
    sendPing,
    sendLeave,
    isOpen: status === "open",
  };
}
