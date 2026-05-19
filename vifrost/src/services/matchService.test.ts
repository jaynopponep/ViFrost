import { describe, it, expect } from "vitest"
import { toMatchRow } from "./matchService"
import type { MatchRecord } from "@/types/profile"

const base: MatchRecord = {
  id: "m1",
  created_at: new Date().toISOString(),
  room_id: "room-1",
  mode: "ranked",
  player1_id: "me",
  player2_id: "foe",
  player1_score: 900,
  player2_score: 400,
  winner_id: "me",
  player1_rating_before: 400,
  player1_rating_after: 416,
  player2_rating_before: 400,
  player2_rating_after: 384,
  challenge: "reverse a list",
  duration_seconds: 73,
}

describe("toMatchRow", () => {
  it("derives a win + positive delta from player1's view", () => {
    const row = toMatchRow(base, "me")
    expect(row.outcome).toBe("W")
    expect(row.ratingChange).toBe(16)
    expect(row.opponent).toBe("foe")
    expect(row.mode).toBe("Ranked")
  })

  it("derives a loss + negative delta from player2's view", () => {
    const row = toMatchRow(base, "foe")
    expect(row.outcome).toBe("L")
    expect(row.ratingChange).toBe(-16)
    expect(row.opponent).toBe("me")
  })

  it("derives a tie when winner_id is null", () => {
    const row = toMatchRow({ ...base, winner_id: null }, "me")
    expect(row.outcome).toBe("D")
  })
})
