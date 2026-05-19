import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useLeaderboard } from "@/hooks/useLeaderboard"
import {
  LeaderboardRow,
  type LeaderboardRowData,
} from "./leaderboard/LeaderboardRow"
import { PodiumCard } from "./leaderboard/PodiumCard"
import { TierBadge } from "./ui/tier-badge"
import { TileHeader } from "./ui/tile-header"
import { ProgressiveBlur } from "./ui/progressive-blur"

export interface GlobalLeaderboardTileProps {
  currentUser: string
}

const PAGE_SIZE = 20

const COLUMN_GRID =
  "grid grid-cols-[60px_1fr_90px_110px_90px_70px] items-center gap-4 px-5 py-2"

function formatRating(v: number) {
  return v.toLocaleString("en-US")
}

export function GlobalLeaderboardTile({ currentUser }: GlobalLeaderboardTileProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [flashId, setFlashId] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const myRowRef = useRef<HTMLDivElement>(null)

  const { data: leaderboardRows = [], isLoading } = useLeaderboard()

  // adapt leaderboard rows to the shape LeaderboardRow/PodiumCard sub-components expect;
  // rank is 1-based index; fields with no real backing (country, apm, change) use neutral values.
  const ALL_ROWS: LeaderboardRowData[] = leaderboardRows.map((r, i) => ({
    id: i + 1,
    player: r.display_name,
    country: "",
    wins: r.wins,
    losses: r.losses,
    rating: r.rating,
    apm: 0,
    change: 0,
  }))

  const TOP_THREE = ALL_ROWS.slice(0, 3)
  const REST = ALL_ROWS.slice(3)

  const myIndex = REST.findIndex((r) => r.player === currentUser)
  const myRowInRest = myIndex >= 0 ? REST[myIndex] : undefined
  const myRowInPodium = TOP_THREE.find((r) => r.player === currentUser)
  const myRow = myRowInRest ?? myRowInPodium

  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = scrollRef.current
    if (!sentinel || !root) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((n) => Math.min(n + PAGE_SIZE, REST.length))
        }
      },
      { root, rootMargin: "120px" },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [visibleCount, REST.length])

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <TileHeader title="Leaderboard" subtitle="Loading…" />
      </div>
    )
  }

  const jumpToMe = () => {
    if (!myRowInRest || myIndex < 0) return
    if (visibleCount <= myIndex) {
      flushSync(() => {
        setVisibleCount(Math.min(myIndex + 6, REST.length))
      })
    }
    myRowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
    setFlashId(myRowInRest.id)
    window.setTimeout(() => setFlashId(null), 900)
  }

  const visibleRest = REST.slice(0, visibleCount)

  return (
    <div className="flex w-full flex-col gap-6">
      <TileHeader
        title="Leaderboard"
        subtitle="Season 4 · 200 ranked players · ends in 23 days"
      />

      {/* Podium */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TOP_THREE.map((r, i) => (
          <PodiumCard key={r.id} row={r} position={(i + 1) as 1 | 2 | 3} />
        ))}
      </div>

      {/* You summary */}
      {myRow ? (
        <div
          className="relative flex flex-col items-start justify-between gap-3 overflow-hidden rounded-xl border border-[color:var(--colorSoftBorder)] px-4 py-3 sm:flex-row sm:items-center"
          style={{
            backgroundImage:
              "linear-gradient(110deg, var(--colorCyanDim) 0%, var(--colorSurfaceAlt) 45%, var(--colorSurfaceAlt) 65%, var(--colorPinkDim) 100%)",
          }}
        >
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--colorTextMuted)]">
              You
            </span>
            <span className="font-mono font-semibold text-[var(--colorText)]">
              #{myRow.id}
            </span>
            <span className="font-medium text-[var(--colorText)]">
              {myRow.player}
            </span>
            <TierBadge rating={myRow.rating} />
            <span className="font-mono text-[var(--colorTextMuted)]">
              {myRow.wins}W · {myRow.losses}L
            </span>
            <span className="font-mono font-medium text-[var(--colorCyan)]">
              {formatRating(myRow.rating)} Rating
            </span>
          </div>
          {myRowInRest ? (
            <button
              type="button"
              onClick={jumpToMe}
              className="rounded-md px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--colorCyan)] transition-[filter] hover:brightness-125"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--colorCyanDim), var(--colorCyanGlow))",
              }}
            >
              Jump to your rank ↓
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-[color:var(--colorSoftBorder)] bg-[var(--colorSurfaceAlt)] px-4 py-3 text-sm text-[var(--colorTextMuted)]">
          <span className="mr-3 font-mono text-xs uppercase tracking-[0.18em]">
            You
          </span>
          Not ranked yet — play ranked matches to join the leaderboard.
        </div>
      )}

      {/* "TOP OF SEASON" label */}
      <div className="font-mono text-[10px] tracking-[0.08em] text-[var(--colorTextMuted)]">
        TOP OF SEASON
      </div>

      {/* Scroll list */}
      <div className="relative overflow-hidden rounded-xl border border-[color:var(--colorSoftBorder)] bg-[var(--colorPanel)]">
        <div
          ref={scrollRef}
          className="relative max-h-[calc(100vh-480px)] min-h-[420px] overflow-y-auto"
        >
          <div
            className={`${COLUMN_GRID} sticky top-0 z-20 bg-[var(--colorPanel)] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--colorTextMuted)]`}
          >
            <div>Rank</div>
            <div>Player</div>
            <div className="text-right">Rating</div>
            <div className="text-right">Record</div>
            <div className="text-right">APM</div>
            <div className="text-right">±</div>
          </div>

          <div className="px-1 pt-1">
            {visibleRest.map((r) => {
              const isYou = r.player === currentUser
              const isFlashing = flashId === r.id
              return (
                <LeaderboardRow
                  key={r.id}
                  row={r}
                  isYou={isYou}
                  isFlashing={isFlashing}
                  ref={isYou ? myRowRef : undefined}
                />
              )
            })}
            {visibleCount < REST.length ? (
              <div ref={sentinelRef} className="h-px" aria-hidden="true" />
            ) : REST.length > 0 ? (
              // terminal spacer: at least as tall as the bottom blur band
              // (25% of the scroll viewport) so the last real player row can
              // always scroll fully clear of the progressive blur.
              <div
                className="flex items-start justify-center pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--colorTextMuted)]"
                style={{ minHeight: "max(112px, calc(25vh - 120px))" }}
              >
                No more players to show
              </div>
            ) : null}
          </div>
        </div>

        <ProgressiveBlur position="bottom" height="25%" />
      </div>
    </div>
  )
}
