import { describe, it, expect } from "vitest";
import {
  matchEndOutcome,
  outcomeTitle,
  outcomeTitleClass,
  outcomeShowsConfetti,
} from "./matchEndOutcome";

describe("matchEndOutcome", () => {
  it("maps winner to outcome", () => {
    expect(matchEndOutcome("player")).toBe("win");
    expect(matchEndOutcome("opponent")).toBe("loss");
    expect(matchEndOutcome("tie")).toBe("tie");
  });

  it("titles each outcome", () => {
    expect(outcomeTitle("win")).toBe("You won");
    expect(outcomeTitle("loss")).toBe("You lost");
    expect(outcomeTitle("tie")).toBe("You tied");
  });

  it("classes each outcome", () => {
    expect(outcomeTitleClass("win")).toBe("is-win");
    expect(outcomeTitleClass("loss")).toBe("is-loss");
    expect(outcomeTitleClass("tie")).toBe("is-tie");
  });

  it("only a win shows confetti (a tie does not)", () => {
    expect(outcomeShowsConfetti("win")).toBe(true);
    expect(outcomeShowsConfetti("loss")).toBe(false);
    expect(outcomeShowsConfetti("tie")).toBe(false);
  });
});
