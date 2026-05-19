import { describe, it, expect } from "vitest";
import {
  PENALTY_ARROW,
  PENALTY_MOUSE,
  PENALTY_COUNTER_PRODUCTIVE,
  isExactReversal,
  type NavCommand,
} from "./vimPenalty";

describe("vimPenalty", () => {
  it("exposes the #22 penalty magnitudes", () => {
    expect(PENALTY_ARROW).toBe(-100);
    expect(PENALTY_MOUSE).toBe(-200);
    expect(PENALTY_COUNTER_PRODUCTIVE).toBe(-60);
  });

  it("isExactReversal: same count, opposite vertical direction", () => {
    const down: NavCommand = { axis: "vertical", forward: true, count: 10 };
    const up: NavCommand = { axis: "vertical", forward: false, count: 10 };
    expect(isExactReversal(down, up)).toBe(true);
    expect(isExactReversal(up, down)).toBe(true);
  });

  it("isExactReversal: different count is NOT a reversal", () => {
    const a: NavCommand = { axis: "vertical", forward: true, count: 10 };
    const b: NavCommand = { axis: "vertical", forward: false, count: 5 };
    expect(isExactReversal(a, b)).toBe(false);
  });

  it("isExactReversal: same direction is NOT a reversal", () => {
    const a: NavCommand = { axis: "vertical", forward: true, count: 3 };
    const b: NavCommand = { axis: "vertical", forward: true, count: 3 };
    expect(isExactReversal(a, b)).toBe(false);
  });

  it("isExactReversal: different axis is NOT a reversal", () => {
    const v: NavCommand = { axis: "vertical", forward: true, count: 2 };
    const h: NavCommand = { axis: "horizontal", forward: false, count: 2 };
    expect(isExactReversal(v, h)).toBe(false);
  });

  it("isExactReversal: word and find axes invert by direction too", () => {
    expect(
      isExactReversal(
        { axis: "word", forward: true, count: 1 },
        { axis: "word", forward: false, count: 1 },
      ),
    ).toBe(true);
    expect(
      isExactReversal(
        { axis: "find", forward: true, count: 1 },
        { axis: "find", forward: false, count: 1 },
      ),
    ).toBe(true);
  });

  it("isExactReversal: null previous is never a reversal", () => {
    expect(
      isExactReversal(null, { axis: "vertical", forward: true, count: 1 }),
    ).toBe(false);
  });
});
