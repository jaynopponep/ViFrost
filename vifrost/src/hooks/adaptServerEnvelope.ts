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
      keybindBonus?: number;
      oppKeybindBonus?: number;
    };
    return {
      type: "match_end",
      payload: {
        // client `match_end` only models winner "me" | "opponent" (the match state reducer
        // is frozen by spec). a tie (won=false, tied=true) maps
        // to "opponent", accepted for the demo; richer tie display is a
        // separate future ui concern
        winner: p.won ? "me" : "opponent",
        reason: "completed",
        playerKeybindScore: p.keybindBonus ?? 0,
        opponentKeybindScore: p.oppKeybindBonus ?? 0,
      },
    };
  }

  if (PASSTHROUGH.has(raw.type)) {
    // payload shape is intentionally not validated for passthrough types;
    // downstream consumers must stay defensive. add per-type guards only if
    // server drift becomes a real problem (yagni for now).
    return raw as ServerMessage;
  }

  return null;
}
