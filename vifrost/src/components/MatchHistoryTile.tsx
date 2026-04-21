import { useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import type { AppOutletContext } from "../App"
import matchHistoryData from "../data/matchHistory.json"
import { MatchFilterBar, type MatchFilter } from "./match/MatchFilterBar"
import { MatchRow, type MatchRowData } from "./match/MatchRow"
import { StatBlock } from "./ui/stat-block"

const MATCHES: MatchRowData[] = matchHistoryData as MatchRowData[]

const COLUMN_GRID =
  "grid grid-cols-[72px_260px_1fr_90px_80px_80px_24px] gap-5 px-5 pb-2 pt-0"

function applyFilter(filter: MatchFilter, rows: MatchRowData[]): MatchRowData[] {
  switch (filter) {
    case "Wins":
      return rows.filter((m) => m.outcome === "W")
    case "Losses":
      return rows.filter((m) => m.outcome === "L")
    case "Ranked":
      return rows.filter((m) => m.mode === "Ranked")
    case "Casual":
      return rows.filter((m) => m.mode === "Casual")
    default:
      return rows
  }
}

export function MatchHistoryTile() {
  const { username } = useOutletContext<AppOutletContext>()
  const safeName = username ?? "ArifMan"

  const [filter, setFilter] = useState<MatchFilter>("All")
  const [expandedId, setExpandedId] = useState<string | null>(MATCHES[0]?.id ?? null)

  const filtered = useMemo(() => applyFilter(filter, MATCHES), [filter])

  const summary = useMemo(() => {
    const wins = MATCHES.filter((m) => m.outcome === "W").length
    const losses = MATCHES.filter((m) => m.outcome === "L").length
    const draws = MATCHES.filter((m) => m.outcome === "D").length
    const total = MATCHES.length
    const ratingDelta = MATCHES.reduce((sum, m) => sum + m.ratingChange, 0)
    const avgTime = Math.round(
      MATCHES.reduce((sum, m) => sum + m.you.time, 0) / Math.max(total, 1),
    )
    const best = MATCHES.reduce((b, m) =>
      m.you.time < b.you.time ? m : b,
    MATCHES[0])
    const bestDiff = best ? best.opp.time - best.you.time : 0
    const winRate = Math.round((wins / Math.max(total, 1)) * 100)
    return {
      wins,
      losses,
      draws,
      total,
      ratingDelta,
      avgTime,
      best,
      bestDiff,
      winRate,
    }
  }, [])

  const streak = useMemo(() => {
    // Leading streak: consecutive Ws from index 0.
    let n = 0
    for (const m of MATCHES) {
      if (m.outcome === "W") n++
      else break
    }
    return n
  }, [])

  return (
    <div className="flex w-full flex-col gap-7">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="m-0 font-mono text-[32px] font-medium text-[var(--colorText)]">
            Match History
          </h1>
          <div className="mt-1.5 text-sm text-[var(--colorTextMuted)]">
            Last {MATCHES.length} matches · current streak{" "}
            <span className="font-mono text-[var(--colorCyan)]">{streak}W</span>
          </div>
        </div>
        <div className="rounded-md bg-[var(--colorCyanDim)] px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--colorCyan)]">
          Latest · {safeName}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBlock
          label="Record"
          value={`${summary.wins}–${summary.losses}–${summary.draws}`}
          sub={`${summary.winRate}% win rate`}
        />
        <StatBlock
          label="Rating Δ"
          value={`${summary.ratingDelta > 0 ? "+" : ""}${summary.ratingDelta}`}
          sub="net change"
          accent={summary.ratingDelta > 0}
        />
        <StatBlock
          label="Avg. Time"
          value={`${summary.avgTime}s`}
          sub="faster than opponents"
        />
        <StatBlock
          label="Best Match"
          value={summary.best?.id ?? "—"}
          sub={
            summary.best
              ? `vs ${summary.best.opponent} · −${summary.bestDiff}s`
              : ""
          }
        />
      </div>

      {/* Filter bar */}
      <MatchFilterBar
        filter={filter}
        onFilterChange={setFilter}
        count={filtered.length}
      />

      <div className="flex flex-col gap-2">
        {/* Column headers */}
        <div
          className={`${COLUMN_GRID} font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--colorTextMuted)]`}
        >
          <div>Result</div>
          <div>Challenge</div>
          <div>Opponent</div>
          <div className="text-right">Δ Rating</div>
          <div className="text-right">Keys</div>
          <div className="text-right">When</div>
          <div />
        </div>

        {/* Rows */}
        <div>
          {filtered.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              expanded={expandedId === m.id}
              onToggle={() =>
                setExpandedId(expandedId === m.id ? null : m.id)
              }
              currentUser={safeName}
            />
          ))}
        </div>
      </div>

      {/* Load older (decorative) */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {}}
          className="cursor-pointer rounded-md border border-[color:var(--colorBorder)] bg-transparent px-5 py-2.5 font-mono text-xs text-[var(--colorTextMuted)] hover:bg-[var(--colorSubtleBg)]"
        >
          Load older matches
        </button>
      </div>
    </div>
  )
}
