import { Avatar } from "../ui/avatar"
import { ChangeBadge } from "../ui/change-badge"
import { TierBadge } from "../ui/tier-badge"

const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "#f4d35e",
  2: "#c0c5cd",
  3: "#c89a72",
}

export interface PodiumCardRow {
  player: string
  country: string
  rating: number
  wins: number
  losses: number
  change: number
}

export interface PodiumCardProps {
  row: PodiumCardRow
  position: 1 | 2 | 3
}

export function PodiumCard({ row, position }: PodiumCardProps) {
  const color = MEDAL_COLORS[position]
  const winRate = Math.round((row.wins / Math.max(row.wins + row.losses, 1)) * 1000) / 10
  return (
    <div
      className="relative overflow-hidden rounded-[12px] border-2 bg-[var(--colorPanel)] px-[22px] py-5"
      style={{
        borderColor: `color-mix(in srgb, ${color} 72%, var(--colorText) 28%)`,
      }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}33, transparent 72%)`,
        }}
      />

      <div className="relative flex items-center gap-3.5">
        <div
          className="w-11 font-mono text-[42px] font-light leading-none"
          style={{ color }}
        >
          {position}
        </div>
        <Avatar name={row.player} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm text-[var(--colorText)]">
            {row.player}
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-[var(--colorTextMuted)]">
            <span>{row.country}</span>
            <span>·</span>
            <TierBadge rating={row.rating} />
          </div>
        </div>
      </div>

      <div
        className="relative mt-3.5 flex items-baseline justify-between border-t border-[color:var(--colorBorder)] pt-3.5"
      >
        <div>
          <div className="font-mono text-[10px] tracking-[0.08em] text-[var(--colorTextMuted)]">
            RATING
          </div>
          <div className="mt-0.5 font-mono text-[22px] text-[var(--colorCyan)]">
            {row.rating.toLocaleString("en-US")}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] tracking-[0.08em] text-[var(--colorTextMuted)]">
            WIN RATE
          </div>
          <div className="mt-0.5 font-mono text-base text-[var(--colorText)]">
            {winRate.toFixed(1)}%
          </div>
        </div>
        <ChangeBadge change={row.change} />
      </div>
    </div>
  )
}
