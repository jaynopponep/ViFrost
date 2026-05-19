import { describe, it, expect } from "vitest";
import { matchReducer, initialMatchState, deriveVim } from "./useMatchState";

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

  it("match_start advances to live from any pre-live phase", () => {
    // recovery: a dropped match_countdown must not strand the client in waiting
    const fromWaiting = matchReducer(init(), {
      type: "MSG",
      envelope: { type: "match_start", payload: {} },
    });
    expect(fromWaiting.phase).toBe("live");
    expect(fromWaiting.countdown).toBeNull();

    const countingDown = { ...init(), phase: "countdown" as const, countdown: 1 };
    const after = matchReducer(countingDown, {
      type: "MSG",
      envelope: { type: "match_start", payload: {} },
    });
    expect(after.phase).toBe("live");
    expect(after.countdown).toBeNull();
  });

  it("match_start does not revive an ended match", () => {
    const ended = { ...init(), phase: "ended" as const };
    const after = matchReducer(ended, {
      type: "MSG",
      envelope: { type: "match_start", payload: {} },
    });
    expect(after).toBe(ended); // unchanged reference
  });

  it("timer_tick promotes a stranded client to live", () => {
    // server only ticks once the match is authoritatively live, so a tick
    // arriving while we are still waiting/countdown means we missed match_start
    const fromWaiting = matchReducer(init(), {
      type: "MSG",
      envelope: { type: "timer_tick", payload: { remaining: 90 } },
    });
    expect(fromWaiting.phase).toBe("live");

    const fromCountdown = matchReducer(
      { ...init(), phase: "countdown" as const, countdown: 2 },
      { type: "MSG", envelope: { type: "timer_tick", payload: { remaining: 90 } } },
    );
    expect(fromCountdown.phase).toBe("live");
    expect(fromCountdown.countdown).toBeNull();
  });

  it("timer_tick does not disturb a live or ended match", () => {
    const live = { ...init(), phase: "live" as const };
    expect(
      matchReducer(live, {
        type: "MSG",
        envelope: { type: "timer_tick", payload: { remaining: 5 } },
      }),
    ).toBe(live);

    const ended = { ...init(), phase: "ended" as const };
    expect(
      matchReducer(ended, {
        type: "MSG",
        envelope: { type: "timer_tick", payload: { remaining: 5 } },
      }),
    ).toBe(ended);
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

  it("starts not submitted", () => {
    expect(init().submitted).toBe(false);
  });

  it("SUBMIT marks submitted only while live", () => {
    const live = { ...init(), phase: "live" as const };
    const submitted = matchReducer(live, { type: "SUBMIT" });
    expect(submitted.submitted).toBe(true);
  });

  it("SUBMIT is a no-op outside live (waiting / ended)", () => {
    const waiting = init();
    expect(matchReducer(waiting, { type: "SUBMIT" })).toBe(waiting);
    const ended = { ...init(), phase: "ended" as const };
    expect(matchReducer(ended, { type: "SUBMIT" })).toBe(ended);
  });

  it("SUBMIT is idempotent (one-shot, matches server guard)", () => {
    const live = { ...init(), phase: "live" as const };
    const once = matchReducer(live, { type: "SUBMIT" });
    const twice = matchReducer(once, { type: "SUBMIT" });
    expect(twice).toBe(once); // unchanged reference
  });

  it("totalTests is corrected from the real run-result length, not the seed", () => {
    // the server sends no totalTests; seed defaults to 5. a 3-test problem
    // must report 3 so the scoreboard denominator is correct.
    const live = { ...initialMatchState(5), phase: "live" as const };
    const after = matchReducer(live, {
      type: "MSG",
      envelope: { type: "run_result", payload: { results: [true, false, false], delta: 0 } },
    });
    expect(after.totalTests).toBe(3);
  });

  it("totalTests also tracks the opponent run-result length", () => {
    const live = { ...initialMatchState(5), phase: "live" as const };
    const after = matchReducer(live, {
      type: "MSG",
      envelope: { type: "opponent_run_result", payload: { results: [true, false, false, false] } },
    });
    expect(after.totalTests).toBe(4);
  });

  it("run_result accumulates passes; a later regression cannot unset one", () => {
    // server scoring is cumulative (PassedTests stays true once passed), so
    // the ui must mirror that or it diverges from the authoritative score
    const live = { ...init(), phase: "live" as const };
    const firstPass = matchReducer(live, {
      type: "MSG",
      envelope: { type: "run_result", payload: { results: [true, true, false], delta: 0 } },
    });
    const regressed = matchReducer(firstPass, {
      type: "MSG",
      envelope: { type: "run_result", payload: { results: [false, true, true], delta: 0 } },
    });
    expect(regressed.playerTests).toEqual([true, true, true]);
  });

  it("opponent_run_result accumulates passes the same way", () => {
    const live = { ...init(), phase: "live" as const };
    const first = matchReducer(live, {
      type: "MSG",
      envelope: { type: "opponent_run_result", payload: { results: [true, false] } },
    });
    const second = matchReducer(first, {
      type: "MSG",
      envelope: { type: "opponent_run_result", payload: { results: [false, true] } },
    });
    expect(second.opponentTests).toEqual([true, true]);
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

  it("score_update records both totals while live", () => {
    const live = { ...init(), phase: "live" as const };
    const after = matchReducer(live, {
      type: "MSG",
      envelope: { type: "score_update", payload: { myScore: 815, opponentScore: 400 } },
    });
    expect(after.playerScore).toBe(815);
    expect(after.opponentScore).toBe(400);
  });

  it("score_update is a no-op when both scores are unchanged", () => {
    const live = {
      ...init(),
      phase: "live" as const,
      playerScore: 815,
      opponentScore: 400,
    };
    const after = matchReducer(live, {
      type: "MSG",
      envelope: { type: "score_update", payload: { myScore: 815, opponentScore: 400 } },
    });
    expect(after).toBe(live); // unchanged reference, no re-render
  });

  it("score_update is ignored outside live", () => {
    const waiting = init();
    expect(
      matchReducer(waiting, {
        type: "MSG",
        envelope: { type: "score_update", payload: { myScore: 99, opponentScore: 1 } },
      }),
    ).toBe(waiting);
    const ended = { ...init(), phase: "ended" as const };
    expect(
      matchReducer(ended, {
        type: "MSG",
        envelope: { type: "score_update", payload: { myScore: 99, opponentScore: 1 } },
      }),
    ).toBe(ended);
  });

  it("INIT resets the scores to zero", () => {
    const s = initialMatchState(5);
    expect(s.playerScore).toBe(0);
    expect(s.opponentScore).toBe(0);
  });

  it("deriveVim subtracts the test component and allows negatives", () => {
    // mid-match server score = passes*400 + vim deltas (exactly)
    expect(deriveVim(815, 2)).toBe(15); // 815 - 800
    expect(deriveVim(400, 1)).toBe(0); // pure test pass, no vim yet
    expect(deriveVim(-35, 0)).toBe(-35); // penalties exceed gains; not clamped
    expect(deriveVim(0, 0)).toBe(0); // initial state
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

  it("match_end with winner='tie' maps to local winner='tie'", () => {
    const after = matchReducer(
      { ...init(), phase: "live" },
      {
        type: "MSG",
        envelope: {
          type: "match_end",
          payload: {
            winner: "tie",
            reason: "completed",
            playerKeybindScore: 0,
            opponentKeybindScore: 0,
          },
        },
      },
    );
    expect(after.phase).toBe("ended");
    expect(after.winner).toBe("tie");
    expect(after.finalKeybindScores).toEqual({ player: 0, opponent: 0 });
  });
});
