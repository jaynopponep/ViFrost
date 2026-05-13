import { Panel } from "../ui/panel"
import { SectionLabel } from "../ui/section-label"

const CELL = 11
const GAP = 3

const MONTHS = ["Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"]

// Heat progression: cyan (quiet days) pink (activity).
const LEVEL_COLORS = [
  "color-mix(in srgb, var(--colorText) 6%, transparent)",
  "color-mix(in srgb, var(--colorCyan) 22%, transparent)",
  "color-mix(in srgb, var(--colorCyan) 50%, transparent)",
  "color-mix(in srgb, var(--colorPink) 55%, transparent)",
  "var(--colorPink)",
]

// 52 weeks × 7 days = 364 cells. Deterministic.
const HEATMAP: number[] = Array.from({ length: 52 * 7 }, (_, i) => {
  const r = (Math.sin(i * 2.31) + Math.cos(i * 0.77) + 2) / 4 // normalize to 0..1
  if (r < 0.45) return 0
  if (r < 0.70) return 1
  if (r < 0.87) return 2
  if (r < 0.96) return 3
  return 4
})

const TOTAL_MATCHES = HEATMAP.reduce((a, v) => a + (v > 0 ? 1 : 0), 0)

export function ActivityHeatmap() {
  const width = 52 * (CELL + GAP)
  const height = 7 * (CELL + GAP)
  return (
    <Panel>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <SectionLabel>Activity</SectionLabel>
          <div className="mt-1 text-sm text-[var(--colorText)]">
            {TOTAL_MATCHES} matches in the last year
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

      <div className="flex flex-col gap-1.5">
        <div className="flex w-full font-mono text-[10px] text-[var(--colorTextMuted)]">
          {MONTHS.map((m) => (
            <div key={m} className="flex-1">
              {m}
            </div>
          ))}
        </div>
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="block"
        >
          {HEATMAP.map((level, i) => {
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
      </div>
    </Panel>
  )
}
