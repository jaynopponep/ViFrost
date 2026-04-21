import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { Avatar } from "../ui/avatar"
import { ChangeBadge } from "../ui/change-badge"
import { TierBadge } from "../ui/tier-badge"

export interface LeaderboardRowData {
  id: number
  player: string
  country: string
  wins: number
  losses: number
  rating: number
  apm: number
  change: number
}

export interface LeaderboardRowProps {
  row: LeaderboardRowData
  isYou?: boolean
  isFlashing?: boolean
}

const ROW_GRID =
  "grid grid-cols-[60px_1fr_90px_110px_90px_70px] items-center gap-4 px-5 py-3.5"

export const LeaderboardRow = forwardRef<HTMLDivElement, LeaderboardRowProps>(
  function LeaderboardRow({ row, isYou = false, isFlashing = false }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          ROW_GRID,
          "mb-1 rounded-[10px] border text-sm transition-colors",
          isYou
            ? "border-[color:var(--colorAccentBorder)] bg-[var(--colorAccentSoft)]"
            : "border-transparent",
          isFlashing && "!bg-[var(--colorCyanGlow)]",
        )}
      >
        <div className="font-mono text-[15px] text-[var(--colorText)] opacity-60">
          {String(row.id).padStart(2, "0")}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.player} size={34} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-sm text-[var(--colorText)]">
                {row.player}
              </span>
              {isYou ? (
                <span className="rounded-[3px] border border-[color:var(--colorAccentBorder)] bg-[var(--colorCyanDim)] px-1.5 py-px font-mono text-[9px] font-bold tracking-[0.08em] text-[var(--colorCyan)]">
                  YOU
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-[var(--colorTextMuted)]">
              <span>{row.country}</span>
              <span>·</span>
              <TierBadge rating={row.rating} />
            </div>
          </div>
        </div>
        <div className="text-right font-mono text-[18px] text-[var(--colorText)]">
          {row.rating.toLocaleString("en-US")}
        </div>
        <div className="text-right font-mono text-[13px] text-[var(--colorTextMuted)]">
          {row.wins}
          <span className="opacity-70">W</span> · {row.losses}
          <span className="opacity-70">L</span>
        </div>
        <div className="text-right font-mono text-[13px] text-[var(--colorTextMuted)]">
          {row.apm}
        </div>
        <div className="text-right">
          <ChangeBadge change={row.change} />
        </div>
      </div>
    )
  },
)
