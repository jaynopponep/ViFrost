import { Panel } from "../ui/panel"
import { SectionLabel } from "../ui/section-label"

const CELL = 11
const GAP = 3

// Heat progression: cyan (quiet days) -> pink (activity).
const LEVEL_COLORS = [
  "color-mix(in srgb, var(--colorText) 6%, transparent)",
  "color-mix(in srgb, var(--colorCyan) 22%, transparent)",
  "color-mix(in srgb, var(--colorCyan) 50%, transparent)",
  "color-mix(in srgb, var(--colorPink) 55%, transparent)",
  "var(--colorPink)",
]

export interface ActivityHeatmapProps {
  cells: number[] // length weeks*7, value 0..4, index 0 = oldest day
  total: number
  weeks: number
}

export function ActivityHeatmap({ cells, total, weeks }: ActivityHeatmapProps) {
  const width = weeks * (CELL + GAP)
  const height = 7 * (CELL + GAP)
  return (
    <Panel>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <SectionLabel>Activity</SectionLabel>
          <div className="mt-1 text-sm text-[var(--colorText)]">
            {total} matches in the last {weeks} weeks
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--colorTextMuted)]">
          less
          {LEVEL_COLORS.map((c, i) => (
            <div
              key={i}
              className="rounded-[2px]"
              style={{ width: CELL, height: CELL, backgroundColor: c }}
            />
          ))}
          more
        </div>
      </div>

      {total === 0 ? (
        <div className="grid h-[98px] place-items-center font-mono text-[12px] text-[var(--colorTextMuted)]">
          No match activity in the last {weeks} weeks.
        </div>
      ) : (
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="block"
        >
          {cells.map((level, i) => {
            const col = Math.floor(i / 7)
            const row = i % 7
            return (
              <rect
                key={i}
                x={col * (CELL + GAP)}
                y={row * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                fill={LEVEL_COLORS[level]}
              />
            )
          })}
        </svg>
      )}
    </Panel>
  )
}
