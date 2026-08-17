import { describe, it, expect } from "vitest"
import {
  toMatchRow,
  fetchMatchRecords,
  firstPublicProfile,
  fetchPublicProfile,
  fetchPublicMatchRecords,
} from "./matchService"
import type { MatchRecord, PublicProfile } from "@/types/profile"

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
  player1_name: "Ada",
  player2_name: "Linus",
}

describe("toMatchRow", () => {
  it("derives a win + positive delta from player1's view", () => {
    const row = toMatchRow(base, "me")
    expect(row.outcome).toBe("W")
    expect(row.ratingChange).toBe(16)
    expect(row.opponent).toBe("Linus")
    expect(row.mode).toBe("Ranked")
  })

  it("derives a loss + negative delta from player2's view", () => {
    const row = toMatchRow(base, "foe")
    expect(row.outcome).toBe("L")
    expect(row.ratingChange).toBe(-16)
    expect(row.opponent).toBe("Ada")
  })

  it("derives a tie when winner_id is null", () => {
    const row = toMatchRow({ ...base, winner_id: null }, "me")
    expect(row.outcome).toBe("D")
  })

  it("falls back to a short id when no opponent name is present", () => {
    const noNames: MatchRecord = {
      ...base,
      player2_id: "abcdef123456",
      player1_name: undefined,
      player2_name: undefined,
    }
    expect(toMatchRow(noNames, "me").opponent).toBe("abcdef")
  })
})

describe("fetchMatchRecords", () => {
  it("is exported as a function", () => {
    expect(typeof fetchMatchRecords).toBe("function")
  })
})

const pub: PublicProfile = {
  id: "u1",
  display_name: "Ada",
  rating: 1200,
  peak_rating: 1300,
  wins: 10,
  losses: 4,
  ties: 1,
  current_streak: 3,
  created_at: new Date("2026-01-02").toISOString(),
}

describe("firstPublicProfile", () => {
  it("returns the first row when the RPC returned rows", () => {
    expect(firstPublicProfile([pub])).toEqual(pub)
  })
  it("returns null for an empty array (player not found)", () => {
    expect(firstPublicProfile([])).toBeNull()
  })
  it("returns null for null/undefined data", () => {
    expect(firstPublicProfile(null)).toBeNull()
    expect(firstPublicProfile(undefined)).toBeNull()
  })
})

describe("fetchPublicProfile / fetchPublicMatchRecords", () => {
  it("are exported as functions", () => {
    expect(typeof fetchPublicProfile).toBe("function")
    expect(typeof fetchPublicMatchRecords).toBe("function")
  })
})
