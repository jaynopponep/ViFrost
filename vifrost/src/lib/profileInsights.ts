import type {
  LeaderboardRow,
  MatchRecord,
  Profile,
} from "@/types/profile"

// the signed-in user's rating after each match, oldest -> newest.
export function deriveRatingTimeline(
  records: MatchRecord[],
  userId: string,
): number[] {
  return [...records]
    .filter((m) => m.player1_id === userId || m.player2_id === userId)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((m) =>
      m.player1_id === userId
        ? m.player1_rating_after
        : m.player2_rating_after,
    )
}

export interface HeatmapData {
  cells: number[]
  // raw per-day match count, same length/indexing as cells (cells is the
  // clamped 0..4 level; counts is the unclamped real number, for tooltips).
  counts: number[]
  total: number
  weeks: number
}

function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x.getTime()
}

function levelForCount(c: number): number {
  if (c <= 0) return 0
  if (c === 1) return 1
  if (c === 2) return 2
  if (c <= 4) return 3
  return 4
}

// daily activity for the last `weeks*7` days ending on `now`. cells[0] is the
// oldest day, the last cell is today. matches outside the window are ignored.
export function deriveActivityHeatmap(
  records: MatchRecord[],
  weeks = 12,
  now: Date = new Date(),
): HeatmapData {
  const days = weeks * 7
  const counts = new Array<number>(days).fill(0)
  const todayStart = startOfDay(now)
  const DAY = 86_400_000
  let total = 0
  for (const m of records) {
    const dayStart = startOfDay(new Date(m.created_at))
    const offset = Math.round((todayStart - dayStart) / DAY)
    if (offset < 0 || offset >= days) continue
    counts[days - 1 - offset]++
    total++
  }
  return { cells: counts.map(levelForCount), counts, total, weeks }
}

export interface AchievementView {
  glyph: string
  title: string
  sub: string
  earned: boolean
  locked: boolean
}

// the original 5 demo achievements. only the two that map to real data are
// evaluated; the rest are permanently locked (no backing data captured yet).
export function deriveAchievements(
  profile: Pick<Profile, "wins"> | null,
  records: MatchRecord[],
): AchievementView[] {
  const wins = profile?.wins ?? 0
  const byDay = new Map<string, number>()
  for (const m of records) {
    const key = m.created_at.slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }
  const maxInADay = byDay.size ? Math.max(...byDay.values()) : 0
  return [
    { glyph: "⚡", title: "Lightning Fingers", sub: "Not tracked yet", earned: false, locked: true },
    { glyph: "✓", title: "Hundred Club", sub: "Win 100 ranked matches", earned: wins >= 100, locked: false },
    { glyph: "∞", title: "Marathon", sub: "Play 50 matches in a day", earned: maxInADay >= 50, locked: false },
    { glyph: "△", title: "Flawless", sub: "Not tracked yet", earned: false, locked: true },
    { glyph: "※", title: "Macro Master", sub: "Not tracked yet", earned: false, locked: true },
  ]
}

// percentile from leaderboard position (rows are already rating desc).
// null when the user is not in the ladder. caveat: the ladder is capped at
// 100, so this is relative to the top 100 only.
export function derivePercentile(
  rows: LeaderboardRow[],
  userId: string,
): string | null {
  const idx = rows.findIndex((r) => r.id === userId)
  if (idx < 0) return null
  const pct = Math.max(1, Math.round(((idx + 1) / rows.length) * 100))
  return `Top ${pct}%`
}
