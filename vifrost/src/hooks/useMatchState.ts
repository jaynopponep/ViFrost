import { useCallback, useEffect, useReducer } from "react";
import type { GameStartPayload, ServerMessage } from "./useWebSocket";

const DEFAULT_TOTAL_TESTS = 5;

export type MatchPhase = "waiting" | "countdown" | "live" | "ended";

export interface MatchState {
  phase: MatchPhase;
  playerReady: boolean;
  opponentReady: boolean;
  countdown: number | null;
  playerTests: boolean[];
  opponentTests: boolean[];
  totalTests: number;
  winner: "player" | "opponent" | null;
  finalKeybindScores: { player: number; opponent: number } | null;
}

export type MatchAction =
  | { type: "INIT"; totalTests: number }
  | { type: "MARK_PLAYER_READY" }
  | { type: "MSG"; envelope: ServerMessage };

export function initialMatchState(totalTests: number): MatchState {
  return {
    phase: "waiting",
    playerReady: false,
    opponentReady: false,
    countdown: null,
    playerTests: [],
    opponentTests: [],
    totalTests,
    winner: null,
    finalKeybindScores: null,
  };
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case "INIT":
      return initialMatchState(action.totalTests);

    case "MARK_PLAYER_READY":
      if (state.phase !== "waiting") return state;
      return { ...state, playerReady: true };

    case "MSG": {
      const { envelope } = action;
      switch (envelope.type) {
        case "opponent_ready":
          if (state.phase !== "waiting") return state;
          return { ...state, opponentReady: true };

        case "match_countdown":
          return { ...state, phase: "countdown", countdown: envelope.payload.seconds };

        case "match_start":
          if (state.phase !== "countdown") return state;
          return { ...state, phase: "live", countdown: null };

        case "run_result": {
          if (state.phase !== "live") return state;
          return { ...state, playerTests: envelope.payload.results };
        }

        case "opponent_run_result": {
          if (state.phase !== "live") return state;
          return { ...state, opponentTests: envelope.payload.results };
        }

        case "match_end":
          return {
            ...state,
            phase: "ended",
            winner: envelope.payload.winner === "me" ? "player" : "opponent",
            finalKeybindScores: {
              player: envelope.payload.playerKeybindScore,
              opponent: envelope.payload.opponentKeybindScore,
            },
          };

        case "score_update":
          // server still echoes during match; new UI ignores mid-match scores
          return state;

        default:
          return state;
      }
    }

    default:
      return state;
  }
}

export interface MatchStateApi extends MatchState {
  playerPct: number;
  opponentPct: number;
  markPlayerReady: () => void;
}

export function useMatchState(
  gameData: GameStartPayload | null,
  lastMessage: ServerMessage | null,
): MatchStateApi {
  const totalTests = gameData?.totalTests ?? DEFAULT_TOTAL_TESTS;
  const [state, dispatch] = useReducer(matchReducer, totalTests, initialMatchState);

  useEffect(() => {
    if (!lastMessage) return;
    dispatch({ type: "MSG", envelope: lastMessage });
  }, [lastMessage]);

  const markPlayerReady = useCallback(() => {
    dispatch({ type: "MARK_PLAYER_READY" });
  }, []);

  const denom = Math.max(state.totalTests, 1);
  const playerPct =
    state.playerTests.length === 0
      ? 0
      : (state.playerTests.filter(Boolean).length / denom) * 100;
  const opponentPct =
    state.opponentTests.length === 0
      ? 0
      : (state.opponentTests.filter(Boolean).length / denom) * 100;

  return {
    ...state,
    playerPct,
    opponentPct,
    markPlayerReady,
  };
}
