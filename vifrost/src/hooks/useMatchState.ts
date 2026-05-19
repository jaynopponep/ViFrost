import { useCallback, useEffect, useReducer } from "react";
import type { GameStartPayload, ServerMessage } from "./useWebSocket";

const DEFAULT_TOTAL_TESTS = 5;

export type MatchPhase = "waiting" | "countdown" | "live" | "ended";

export interface BonusBreakdown {
  keybind: number;
  completion: number;
  finish: number;
}

export interface MatchState {
  phase: MatchPhase;
  playerReady: boolean;
  opponentReady: boolean;
  countdown: number | null;
  playerTests: boolean[];
  opponentTests: boolean[];
  totalTests: number;
  winner: "player" | "opponent" | "tie" | null;
  // the three end-of-match bonuses per side. these (plus raw score) are what
  // actually decide win/loss, so the banner surfaces them.
  finalBonuses: { player: BonusBreakdown; opponent: BonusBreakdown } | null;
  submitted: boolean;
  playerScore: number;
  opponentScore: number;
}

export type MatchAction =
  | { type: "INIT"; totalTests: number }
  | { type: "MARK_PLAYER_READY" }
  | { type: "SUBMIT" }
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
    finalBonuses: null,
    submitted: false,
    playerScore: 0,
    opponentScore: 0,
  };
}

// server scoring is cumulative: once a test passes it stays passed. the run
// vectors the server broadcasts are per-run, so the ui must OR them into the
// accumulated state or it diverges from the authoritative score.
function mergePasses(prev: boolean[], next: boolean[]): boolean[] {
  const len = Math.max(prev.length, next.length);
  const out = new Array<boolean>(len);
  for (let i = 0; i < len; i++) out[i] = Boolean(prev[i]) || Boolean(next[i]);
  return out;
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case "INIT":
      return initialMatchState(action.totalTests);

    case "MARK_PLAYER_READY":
      if (state.phase !== "waiting") return state;
      return { ...state, playerReady: true };

    case "SUBMIT":
      // one-shot, live-only: mirrors the server's `if from.Submitted` guard
      // and the fact submit is only meaningful during a running match.
      if (state.phase !== "live" || state.submitted) return state;
      return { ...state, submitted: true };

    case "MSG": {
      const { envelope } = action;
      switch (envelope.type) {
        case "opponent_ready":
          if (state.phase !== "waiting") return state;
          return { ...state, opponentReady: true };

        case "match_countdown":
          return { ...state, phase: "countdown", countdown: envelope.payload.seconds };

        case "match_start":
          // recovery: advance from any pre-live phase. a dropped
          // match_countdown must never strand the client in waiting. do not
          // revive a match that already ended.
          if (state.phase === "ended" || state.phase === "live") return state;
          return { ...state, phase: "live", countdown: null };

        case "timer_tick":
          // server only ticks once the match is authoritatively live, so a
          // tick while still pre-live means we missed match_start. otherwise
          // a no-op (the timer ui reads the server value elsewhere).
          if (state.phase !== "waiting" && state.phase !== "countdown") return state;
          return { ...state, phase: "live", countdown: null };

        case "run_result": {
          if (state.phase !== "live") return state;
          const playerTests = mergePasses(state.playerTests, envelope.payload.results);
          // the server sends no totalTests; every run vector is the full test
          // count, so correct the seeded guess from observed reality.
          return {
            ...state,
            playerTests,
            totalTests: Math.max(playerTests.length, state.opponentTests.length),
          };
        }

        case "opponent_run_result": {
          if (state.phase !== "live") return state;
          const opponentTests = mergePasses(state.opponentTests, envelope.payload.results);
          return {
            ...state,
            opponentTests,
            totalTests: Math.max(state.playerTests.length, opponentTests.length),
          };
        }

        case "match_end":
          return {
            ...state,
            phase: "ended",
            winner:
              envelope.payload.winner === "me"
                ? "player"
                : envelope.payload.winner === "tie"
                  ? "tie"
                  : "opponent",
            finalBonuses: {
              player: {
                keybind: envelope.payload.playerKeybindScore,
                completion: envelope.payload.playerCompletionBonus,
                finish: envelope.payload.playerFinishBonus,
              },
              opponent: {
                keybind: envelope.payload.opponentKeybindScore,
                completion: envelope.payload.opponentCompletionBonus,
                finish: envelope.payload.opponentFinishBonus,
              },
            },
          };

        case "score_update":
          // authoritative combined totals (tests*400 + vim deltas). guarded to
          // live like the other gameplay cases. vim figures are derived, not
          // stored (see deriveVim).
          if (state.phase !== "live") return state;
          if (
            state.playerScore === envelope.payload.myScore &&
            state.opponentScore === envelope.payload.opponentScore
          )
            return state;
          return {
            ...state,
            playerScore: envelope.payload.myScore,
            opponentScore: envelope.payload.opponentScore,
          };

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
  playerVim: number;
  opponentVim: number;
  markPlayerReady: () => void;
  markSubmitted: () => void;
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

  const markSubmitted = useCallback(() => {
    dispatch({ type: "SUBMIT" });
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

  const playerVim = deriveVim(
    state.playerScore,
    state.playerTests.filter(Boolean).length,
  );
  const opponentVim = deriveVim(
    state.opponentScore,
    state.opponentTests.filter(Boolean).length,
  );

  return {
    ...state,
    playerPct,
    opponentPct,
    playerVim,
    opponentVim,
    markPlayerReady,
    markSubmitted,
  };
}

// mid-match the server applies only test passes (+400 each) and client vim
// deltas to Score, so vim = score - passes*400 
export function deriveVim(score: number, passedCount: number): number {
  return score - passedCount * 400;
}
