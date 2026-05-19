import type { ServerMessage } from "./useWebSocket";

type RawEnvelope = { type: string; payload?: unknown };

const PASSTHROUGH = new Set<string>([
  "match_found",
  "game_start",
  "timer_tick",
  "run_result",
  "score_update",
  "opponent_run_result",
  "match_countdown",
  "match_start",
  "opponent_ready",
  "error",
]);

export function adaptServerEnvelope(raw: RawEnvelope): ServerMessage | null {
  if (!raw || typeof raw.type !== "string") return null;

  if (raw.type === "game_end") {
    if (!raw.payload || typeof raw.payload !== "object") return null;
    const p = raw.payload as {
      won?: boolean;
      tied?: boolean;
      keybindBonus?: number;
      oppKeybindBonus?: number;
    };
    return {
      type: "match_end",
      payload: {
        // three-way outcome: tied wins over won (a draw is not a player win).
        // the server (room.go) sets tied iff scores are equal, won iff
        // strictly greater, so these are mutually exclusive.
        winner: p.tied ? "tie" : p.won ? "me" : "opponent",
        reason: "completed",
        playerKeybindScore: p.keybindBonus ?? 0,
        opponentKeybindScore: p.oppKeybindBonus ?? 0,
      },
    };
  }

  if (PASSTHROUGH.has(raw.type)) {
    // guard only the types whose payload the reducer dereferences. a
    // malformed frame is dropped (null) rather than crashing the reducer.
    // payload-less passthroughs (match_found, match_start, opponent_ready,
    // error, score_update, game_start) are intentionally not gated.
    const p = raw.payload as Record<string, unknown> | null | undefined;

    if (raw.type === "run_result" || raw.type === "opponent_run_result") {
      // a syntax error / timeout / unparseable output makes the server send
      // results: null (go marshals a nil []bool as null). dropping the frame
      // here strands the client in "running" forever (setIsRunning(false)
      // only fires on a delivered run_result). normalise instead: pass the
      // frame through with results coerced to [] so the run completes with
      // zero passed tests and the reducer still gets a valid array.
      const results = p && isBoolArray(p.results) ? p.results : [];
      return { type: raw.type, payload: { ...(p ?? {}), results } } as ServerMessage;
    }
    if (raw.type === "match_countdown") {
      if (!p || typeof p.seconds !== "number") return null;
    }

    return raw as ServerMessage;
  }

  return null;
}

function isBoolArray(v: unknown): v is boolean[] {
  return Array.isArray(v) && v.every((x) => typeof x === "boolean");
}
