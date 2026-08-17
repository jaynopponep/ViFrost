import { describe, it, expect } from "vitest";
import { matchEndStyleScores, type MatchEndStyleInput } from "./matchEndStats";

describe("matchEndStyleScores", () => {
  it("reports each player's accumulated style (the live vim figure)", () => {
    // the number the player watched climb to 1060 during the match must be
    // the number the end banner shows.
    expect(
      matchEndStyleScores({ playerVim: 1060, opponentVim: 0 }),
    ).toEqual({ player: 1060, opponent: 0 });
  });

  it("does NOT use the comparative end-of-game keybind bonus", () => {
    // regression: the banner used to read keybindBonus, which is awarded to
    // whoever pressed FEWER keys. an idle opponent (0 style) then showed a
    // huge 'style' while the active winner showed 0. style is per-player
    // accumulated, never the comparative efficiency bonus.
    // a caller that also threads the comparative keybind bonus through must
    // not see it leak into Style. cast isolates the deliberately-extra fields.
    const input = {
      playerVim: 1060,
      opponentVim: 0,
      playerKeybindBonus: 0,
      opponentKeybindBonus: 1360,
    } as MatchEndStyleInput;
    expect(matchEndStyleScores(input)).toEqual({ player: 1060, opponent: 0 });
  });

  it("passes negative style through (vim penalties are not clamped)", () => {
    expect(
      matchEndStyleScores({ playerVim: -35, opponentVim: 120 }),
    ).toEqual({ player: -35, opponent: 120 });
  });
});
