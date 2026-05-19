import { describe, it, expect } from "vitest";
import { adaptServerEnvelope } from "./adaptServerEnvelope";

describe("adaptServerEnvelope", () => {
  it("passes game_start through unchanged", () => {
    const raw = { type: "game_start", payload: { roomId: "r1", snippet: "x", duration: 120, opponentName: "o", playerColor: "a", opponentColor: "b" } };
    expect(adaptServerEnvelope(raw)).toEqual(raw);
  });

  it("passes match_found through (LobbyPage gates navigation on it)", () => {
    const raw = { type: "match_found", payload: null };
    expect(adaptServerEnvelope(raw)).toEqual(raw);
  });

  it("transforms game_end (win) into match_end", () => {
    const raw = { type: "game_end", payload: { score: 900, opponentScore: 400, won: true, tied: false, keybindBonus: 120, completionBonus: 240, finishBonus: 0, oppKeybindBonus: 0, oppCompletionBonus: 0, oppFinishBonus: 0 } };
    expect(adaptServerEnvelope(raw)).toEqual({
      type: "match_end",
      payload: {
        winner: "me",
        reason: "completed",
        playerKeybindScore: 120,
        opponentKeybindScore: 0,
        playerCompletionBonus: 240,
        opponentCompletionBonus: 0,
        playerFinishBonus: 0,
        opponentFinishBonus: 0,
      },
    });
  });

  it("transforms game_end (loss) into match_end with winner opponent", () => {
    const raw = { type: "game_end", payload: { score: 100, opponentScore: 800, won: false, tied: false, keybindBonus: 0, completionBonus: 0, finishBonus: 0, oppKeybindBonus: 60, oppCompletionBonus: 0, oppFinishBonus: 0 } };
    const out = adaptServerEnvelope(raw);
    expect(out).toEqual({
      type: "match_end",
      payload: {
        winner: "opponent",
        reason: "completed",
        playerKeybindScore: 0,
        opponentKeybindScore: 60,
        playerCompletionBonus: 0,
        opponentCompletionBonus: 0,
        playerFinishBonus: 0,
        opponentFinishBonus: 0,
      },
    });
  });

  it("maps a tie (tied=true) to winner 'tie'", () => {
    const raw = { type: "game_end", payload: { score: 500, opponentScore: 500, won: false, tied: true, keybindBonus: 0, completionBonus: 0, finishBonus: 0, oppKeybindBonus: 0, oppCompletionBonus: 0, oppFinishBonus: 0 } };
    expect(adaptServerEnvelope(raw)).toEqual({
      type: "match_end",
      payload: {
        winner: "tie",
        reason: "completed",
        playerKeybindScore: 0,
        opponentKeybindScore: 0,
        playerCompletionBonus: 0,
        opponentCompletionBonus: 0,
        playerFinishBonus: 0,
        opponentFinishBonus: 0,
      },
    });
  });

  it("drops game_end with missing payload", () => {
    expect(adaptServerEnvelope({ type: "game_end" })).toBeNull();
  });

  it("defaults keybind scores to 0 when absent from game_end payload", () => {
    const raw = { type: "game_end", payload: { won: true } };
    expect(adaptServerEnvelope(raw)).toEqual({
      type: "match_end",
      payload: {
        winner: "me",
        reason: "completed",
        playerKeybindScore: 0,
        opponentKeybindScore: 0,
        playerCompletionBonus: 0,
        opponentCompletionBonus: 0,
        playerFinishBonus: 0,
        opponentFinishBonus: 0,
      },
    });
  });

  it("passes opponent_run_result through", () => {
    const raw = { type: "opponent_run_result", payload: { results: [true, false] } };
    expect(adaptServerEnvelope(raw)).toEqual(raw);
  });

  it("drops unknown types", () => {
    expect(adaptServerEnvelope({ type: "pong", payload: null })).toBeNull();
  });

  // a syntax error / timeout makes the server send results: null. the frame
  // must pass through (results normalised to []) so the client leaves the
  // "running" state instead of hanging forever.
  it("normalises run_result with non-array results to [] instead of dropping", () => {
    expect(adaptServerEnvelope({ type: "run_result", payload: { results: "oops", delta: 0 } })).toEqual({
      type: "run_result",
      payload: { results: [], delta: 0 },
    });
    expect(adaptServerEnvelope({ type: "run_result", payload: null })).toEqual({
      type: "run_result",
      payload: { results: [] },
    });
    expect(adaptServerEnvelope({ type: "run_result" })).toEqual({
      type: "run_result",
      payload: { results: [] },
    });
  });

  it("normalises opponent_run_result with non-array results to [] instead of dropping", () => {
    expect(adaptServerEnvelope({ type: "opponent_run_result", payload: { results: 42 } })).toEqual({
      type: "opponent_run_result",
      payload: { results: [] },
    });
    expect(adaptServerEnvelope({ type: "opponent_run_result", payload: {} })).toEqual({
      type: "opponent_run_result",
      payload: { results: [] },
    });
  });

  it("drops match_countdown whose seconds is not a number", () => {
    expect(adaptServerEnvelope({ type: "match_countdown", payload: { seconds: "3" } })).toBeNull();
    expect(adaptServerEnvelope({ type: "match_countdown", payload: null })).toBeNull();
  });

  it("still passes a well-formed run_result through unchanged", () => {
    const raw = { type: "run_result", payload: { results: [true, false], delta: 10 } };
    expect(adaptServerEnvelope(raw)).toEqual(raw);
  });

  it("still passes match_found (null payload) and match_start through", () => {
    expect(adaptServerEnvelope({ type: "match_found", payload: null })).toEqual({ type: "match_found", payload: null });
    expect(adaptServerEnvelope({ type: "match_start", payload: null })).toEqual({ type: "match_start", payload: null });
  });
});
