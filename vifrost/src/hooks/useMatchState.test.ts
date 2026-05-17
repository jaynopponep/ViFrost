import { describe, it, expect } from "vitest";
import { matchReducer, initialMatchState } from "./useMatchState";

const init = () => initialMatchState(5);

describe("matchReducer", () => {
  it("starts in waiting phase with no readies", () => {
    const s = init();
    expect(s.phase).toBe("waiting");
    expect(s.playerReady).toBe(false);
    expect(s.opponentReady).toBe(false);
  });

  it("MARK_PLAYER_READY flips own ready only in waiting", () => {
    const s1 = matchReducer(init(), { type: "MARK_PLAYER_READY" });
    expect(s1.playerReady).toBe(true);
    expect(s1.opponentReady).toBe(false);

    const liveState = { ...s1, phase: "live" as const };
    const s2 = matchReducer(liveState, { type: "MARK_PLAYER_READY" });
    expect(s2).toBe(liveState); // unchanged reference
  });

  it("opponent_ready flips opponent ready", () => {
    const s = matchReducer(init(), {
      type: "MSG",
      envelope: { type: "opponent_ready", payload: {} },
    });
    expect(s.opponentReady).toBe(true);
  });

  it("match_countdown sets phase=countdown and the seconds", () => {
    const s = matchReducer(init(), {
      type: "MSG",
      envelope: { type: "match_countdown", payload: { seconds: 3 } },
    });
    expect(s.phase).toBe("countdown");
    expect(s.countdown).toBe(3);
  });

  it("match_start only advances from countdown to live", () => {
    // From waiting: ignored
    const fromWaiting = matchReducer(init(), {
      type: "MSG",
      envelope: { type: "match_start", payload: {} },
    });
    expect(fromWaiting.phase).toBe("waiting");

    // From countdown: advances
    const countingDown = { ...init(), phase: "countdown" as const, countdown: 1 };
    const after = matchReducer(countingDown, {
      type: "MSG",
      envelope: { type: "match_start", payload: {} },
    });
    expect(after.phase).toBe("live");
    expect(after.countdown).toBeNull();
  });

  it("run_result is ignored unless phase=live", () => {
    const ignored = matchReducer(init(), {
      type: "MSG",
      envelope: { type: "run_result", payload: { results: [true, true, false, false, false], delta: 0 } },
    });
    expect(ignored.playerTests).toEqual([]);

    const live = { ...init(), phase: "live" as const };
    const after = matchReducer(live, {
      type: "MSG",
      envelope: { type: "run_result", payload: { results: [true, true, false, false, false], delta: 0 } },
    });
    expect(after.playerTests).toEqual([true, true, false, false, false]);
  });

  it("opponent_run_result updates opponentTests only in live", () => {
    const live = { ...init(), phase: "live" as const };
    const after = matchReducer(live, {
      type: "MSG",
      envelope: { type: "opponent_run_result", payload: { results: [true, false, false, false, false] } },
    });
    expect(after.opponentTests).toEqual([true, false, false, false, false]);
  });

  it("match_end sets phase=ended, winner, and final scores", () => {
    const after = matchReducer(
      { ...init(), phase: "live" },
      {
        type: "MSG",
        envelope: {
          type: "match_end",
          payload: {
            winner: "me",
            reason: "completed",
            playerKeybindScore: 42,
            opponentKeybindScore: 31,
          },
        },
      },
    );
    expect(after.phase).toBe("ended");
    expect(after.winner).toBe("player");
    expect(after.finalKeybindScores).toEqual({ player: 42, opponent: 31 });
  });

  it("score_update mid-match is ignored", () => {
    const s = { ...init(), phase: "live" as const };
    const after = matchReducer(s, {
      type: "MSG",
      envelope: { type: "score_update", payload: { myScore: 99, opponentScore: 1 } },
    });
    expect(after).toBe(s);
  });

  it("opponent_ready is ignored outside waiting", () => {
    const live = { ...init(), phase: "live" as const };
    const after = matchReducer(live, {
      type: "MSG",
      envelope: { type: "opponent_ready", payload: {} },
    });
    expect(after).toBe(live);
  });

  it("opponent_run_result is ignored outside live", () => {
    const waiting = init();
    const after = matchReducer(waiting, {
      type: "MSG",
      envelope: { type: "opponent_run_result", payload: { results: [true] } },
    });
    expect(after.opponentTests).toEqual([]);
  });

  it("match_end with winner='opponent' maps to local winner='opponent'", () => {
    const after = matchReducer(
      { ...init(), phase: "live" },
      {
        type: "MSG",
        envelope: {
          type: "match_end",
          payload: {
            winner: "opponent",
            reason: "completed",
            playerKeybindScore: 10,
            opponentKeybindScore: 99,
          },
        },
      },
    );
    expect(after.winner).toBe("opponent");
    expect(after.finalKeybindScores).toEqual({ player: 10, opponent: 99 });
  });
});
