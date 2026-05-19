import { requireSupabase } from "@/lib/supabase"
import type { LeaderboardRow, MatchRecord } from "@/types/profile"
import type { MatchRowData } from "@/components/match/MatchRow"

// pure mapping from a symmetric match row to the current user's perspective.
// no network here so it is unit-testable in isolation.
export function toMatchRow(m: MatchRecord, userId: string): MatchRowData {
  const isP1 = m.player1_id === userId
  const before = isP1 ? m.player1_rating_before : m.player2_rating_before
  const after = isP1 ? m.player1_rating_after : m.player2_rating_after
  const outcome: MatchRowData["outcome"] =
    m.winner_id === null ? "D" : m.winner_id === userId ? "W" : "L"
  const youScore = isP1 ? m.player1_score : m.player2_score
  const oppScore = isP1 ? m.player2_score : m.player1_score
  return {
    id: m.id.slice(0, 6),
    outcome,
    mode: m.mode === "ranked" ? "Ranked" : "Casual",
    challenge: m.challenge || "Practice",
    opponent: isP1 ? m.player2_id : m.player1_id,
    oppRating: isP1 ? m.player2_rating_after : m.player1_rating_after,
    ratingChange: after - before,
    you: { keystrokes: youScore, time: m.duration_seconds, wpm: 0 },
    opp: { keystrokes: oppScore, time: m.duration_seconds, wpm: 0 },
    when: new Date(m.created_at).toLocaleDateString(),
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const sb = requireSupabase()
  // get_leaderboard is a security definer function (not a view): it returns
  // only safe columns and already orders by rating desc, limit 100.
  const { data, error } = await sb.rpc("get_leaderboard")
  if (error) throw error
  return (data ?? []) as LeaderboardRow[]
}

export async function fetchMatchHistory(
  userId: string,
): Promise<MatchRowData[]> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) throw error
  return ((data ?? []) as MatchRecord[]).map((m) => toMatchRow(m, userId))
}
