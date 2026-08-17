import { describe, it, expect } from "vitest"
import { deriveRatingTimeline } from "./profileInsights"
import type { MatchRecord } from "@/types/profile"
import { matchRecordsQuerySpec } from "@/hooks/useProfileInsights"

function rec(over: Partial<MatchRecord>): MatchRecord {
  return {
    id: "x",
    created_at: "2026-01-01T00:00:00Z",
    room_id: "r",
    mode: "ranked",
    player1_id: "me",
    player2_id: "foe",
    player1_score: 0,
    player2_score: 0,
    winner_id: null,
    player1_rating_before: 400,
    player1_rating_after: 400,
    player2_rating_before: 400,
    player2_rating_after: 400,
    challenge: "c",
    duration_seconds: 120,
    ...over,
  }
}

describe("deriveRatingTimeline", () => {
  it("returns the user's rating_after oldest->newest, picking the right side", () => {
    const records = [
      rec({ created_at: "2026-01-03T00:00:00Z", player1_id: "me", player1_rating_after: 430 }),
      rec({ created_at: "2026-01-01T00:00:00Z", player1_id: "me", player1_rating_after: 410 }),
      rec({ created_at: "2026-01-02T00:00:00Z", player1_id: "foe", player2_id: "me", player2_rating_after: 420 }),
    ]
    expect(deriveRatingTimeline(records, "me")).toEqual([410, 420, 430])
  })

  it("returns [] for no records", () => {
    expect(deriveRatingTimeline([], "me")).toEqual([])
  })

  it("excludes records where userId is neither player", () => {
    const unrelated = rec({ player1_id: "a", player2_id: "b", player1_rating_after: 999, player2_rating_after: 888 })
    expect(deriveRatingTimeline([unrelated], "me")).toEqual([])
  })
})

import { deriveActivityHeatmap } from "./profileInsights"

describe("deriveActivityHeatmap", () => {
  const now = new Date("2026-05-19T12:00:00Z")

  it("cells length = weeks*7 and total counts only in-window matches", () => {
    const records = [
      rec({ created_at: "2026-05-19T01:00:00Z" }), // today
      rec({ created_at: "2026-05-19T05:00:00Z" }), // today
      rec({ created_at: "2026-01-01T00:00:00Z" }), // outside 12wk window
    ]
    const h = deriveActivityHeatmap(records, 12, now)
    expect(h.cells.length).toBe(84)
    expect(h.weeks).toBe(12)
    expect(h.total).toBe(2)
    expect(h.cells[h.cells.length - 1]).toBe(2) // last cell = today, 2 matches -> level 2
  })

  it("maps count to level: 1->1, 2->2, 3->3, 4->3, 5->4", () => {
    const day = (n: number) =>
      Array.from({ length: n }, () => rec({ created_at: "2026-05-18T09:00:00Z" }))
    expect(deriveActivityHeatmap(day(1), 12, now).cells.at(-2)).toBe(1)
    expect(deriveActivityHeatmap(day(2), 12, now).cells.at(-2)).toBe(2)
    expect(deriveActivityHeatmap(day(3), 12, now).cells.at(-2)).toBe(3)
    expect(deriveActivityHeatmap(day(4), 12, now).cells.at(-2)).toBe(3)
    expect(deriveActivityHeatmap(day(5), 12, now).cells.at(-2)).toBe(4)
  })

  it("empty records -> all zero cells, total 0", () => {
    const h = deriveActivityHeatmap([], 12, now)
    expect(h.total).toBe(0)
    expect(h.cells.every((c) => c === 0)).toBe(true)
  })

  it("exposes raw per-day counts (unclamped, same indexing as cells)", () => {
    const day = (n: number) =>
      Array.from({ length: n }, () => rec({ created_at: "2026-05-18T09:00:00Z" }))
    const h = deriveActivityHeatmap(day(5), 12, now)
    expect(h.counts.length).toBe(h.cells.length)
    // yesterday cell holds the raw 5 while the level is clamped to 4
    expect(h.counts.at(-2)).toBe(5)
    expect(h.cells.at(-2)).toBe(4)
    // a day with no matches is 0 in counts too
    expect(h.counts.at(-1)).toBe(0)
    expect(deriveActivityHeatmap([], 12, now).counts.every((c) => c === 0)).toBe(
      true,
    )
  })
})

import { deriveAchievements } from "./profileInsights"
import type { Profile } from "@/types/profile"

function prof(over: Partial<Profile>): Profile {
  return {
    id: "me",
    email: "a@b.c",
    full_name: null,
    role: "user",
    status: "approved",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 400,
    peak_rating: 400,
    wins: 0,
    losses: 0,
    ties: 0,
    current_streak: 0,
    ...over,
  }
}

describe("deriveAchievements", () => {
  it("returns all 5 in order; 3 are permanently locked", () => {
    const a = deriveAchievements(prof({}), [])
    expect(a.map((x) => x.title)).toEqual([
      "Lightning Fingers",
      "Hundred Club",
      "Marathon",
      "Flawless",
      "Macro Master",
    ])
    expect(a[0].locked).toBe(true)
    expect(a[3].locked).toBe(true)
    expect(a[4].locked).toBe(true)
    expect(a.filter((x) => x.locked).every((x) => x.earned === false)).toBe(true)
  })

  it("Hundred Club earned at >=100 wins, not at 99", () => {
    expect(deriveAchievements(prof({ wins: 99 }), [])[1].earned).toBe(false)
    expect(deriveAchievements(prof({ wins: 100 }), [])[1].earned).toBe(true)
  })

  it("Marathon earned when a calendar day has >=50 matches", () => {
    const same = Array.from({ length: 50 }, () =>
      rec({ created_at: "2026-05-10T08:00:00Z" }),
    )
    expect(deriveAchievements(prof({}), same)[2].earned).toBe(true)
    const fewer = Array.from({ length: 49 }, () =>
      rec({ created_at: "2026-05-10T08:00:00Z" }),
    )
    expect(deriveAchievements(prof({}), fewer)[2].earned).toBe(false)
  })

  it("Marathon: 50 records at 23:30Z all count as one UTC day", () => {
    // timestamps straddle local midnight in many timezones but are all 2026-05-10 in UTC
    const same = Array.from({ length: 50 }, () =>
      rec({ created_at: "2026-05-10T23:30:00Z" }),
    )
    expect(deriveAchievements(prof({}), same)[2].earned).toBe(true)
  })

  it("handles null profile", () => {
    expect(deriveAchievements(null, [])[1].earned).toBe(false)
  })
})

import { derivePercentile } from "./profileInsights"
import type { LeaderboardRow } from "@/types/profile"

function lb(ids: string[]): LeaderboardRow[] {
  return ids.map((id, i) => ({
    id,
    display_name: id,
    rating: 1000 - i,
    wins: 0,
    losses: 0,
    ties: 0,
  }))
}

describe("derivePercentile", () => {
  it("rank 1 of 100 -> Top 1%", () => {
    const rows = lb(Array.from({ length: 100 }, (_, i) => `p${i}`))
    expect(derivePercentile(rows, "p0")).toBe("Top 1%")
  })

  it("midway rank rounds", () => {
    const rows = lb(Array.from({ length: 100 }, (_, i) => `p${i}`))
    expect(derivePercentile(rows, "p49")).toBe("Top 50%")
  })

  it("not in ladder -> null", () => {
    expect(derivePercentile(lb(["a", "b"]), "me")).toBeNull()
  })

  it("single-row ladder, user present -> Top 100%", () => {
    expect(derivePercentile(lb(["me"]), "me")).toBe("Top 100%")
  })

  it("last place in a full 100-row ladder -> Top 100%", () => {
    const rows = lb(Array.from({ length: 100 }, (_, i) => `p${i}`))
    expect(derivePercentile(rows, "p99")).toBe("Top 100%")
  })
})

describe("matchRecordsQuerySpec", () => {
  it("scopes the query key by source so own vs public never collide", () => {
    const own = matchRecordsQuerySpec("u1", "own")
    const pub = matchRecordsQuerySpec("u1", "public")
    expect(own.queryKey).toEqual(["matchRecords", "own", "u1"])
    expect(pub.queryKey).toEqual(["matchRecords", "public", "u1"])
  })
  it("uses 'anon' when no user id is given and defaults scope to own", () => {
    const spec = matchRecordsQuerySpec(undefined)
    expect(spec.queryKey).toEqual(["matchRecords", "own", "anon"])
  })
})
