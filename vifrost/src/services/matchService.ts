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
  // get_match_history resolves these via a security-definer join; fall back to
  // a short id slice if a name is missing (e.g. a raw `matches` read).
  const oppName = isP1 ? m.player2_name : m.player1_name
  const oppId = isP1 ? m.player2_id : m.player1_id
  return {
    id: m.id.slice(0, 6),
    outcome,
    mode: m.mode === "ranked" ? "Ranked" : "Casual",
    challenge: m.challenge || "Practice",
    opponent: oppName || oppId.slice(0, 6),
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
  // get_match_history is a security-definer RPC: it scopes rows to the caller
  // (auth.uid()) and resolves opponent display names, which a direct `matches`
  // read cannot do under select-own profiles RLS.
  const { data, error } = await sb.rpc("get_match_history")
  if (error) throw error
  return ((data ?? []) as MatchRecord[]).map((m) => toMatchRow(m, userId))
}

// raw match rows (no per-row perspective mapping) for profile insights.
// same single get_match_history RPC as fetchMatchHistory; additive.
export async function fetchMatchRecords(): Promise<MatchRecord[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.rpc("get_match_history")
  if (error) throw error
  return (data ?? []) as MatchRecord[]
}
