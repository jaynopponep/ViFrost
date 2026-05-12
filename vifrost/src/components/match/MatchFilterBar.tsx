export type MatchFilter = "All" | "Wins" | "Losses" | "Ranked" | "Casual"

const FILTERS: MatchFilter[] = ["All", "Wins", "Losses", "Ranked", "Casual"]

export interface MatchFilterBarProps {
  filter: MatchFilter
  onFilterChange: (f: MatchFilter) => void
  count: number
}

export function MatchFilterBar({
  filter,
  onFilterChange,
  count,
}: MatchFilterBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        {FILTERS.map((f) => {
          const active = f === filter
          return (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className="cursor-pointer rounded-[6px] border px-3.5 py-[7px] font-mono text-[12px] transition-colors"
              style={{
                backgroundImage: active
                  ? "linear-gradient(135deg, var(--colorCyanDim), var(--colorAccentSoft))"
                  : "none",
                backgroundColor: active ? undefined : "transparent",
                borderColor: active
                  ? "var(--colorAccentBorder)"
                  : "var(--colorBorder)",
                color: active ? "var(--colorCyan)" : "var(--colorTextMuted)",
              }}
            >
              {f}
            </button>
          )
        })}
      </div>
      <div className="font-mono text-[11px] text-[var(--colorTextMuted)]">
        {count} matches
      </div>
    </div>
  )
}
