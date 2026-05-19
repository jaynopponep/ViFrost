import { useRef, useState } from "react"
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
  // raw per-day match count, same indexing as cells. when present, each cell
  // gets an instant hover tooltip with that day's match count.
  counts?: number[]
  total: number
  weeks: number
}

function matchLabel(n: number): string {
  if (n <= 0) return "No matches"
  return n === 1 ? "1 match" : `${n} matches`
}

interface HoverState {
  x: number
  y: number
  n: number
}

export function ActivityHeatmap({
  cells,
  counts,
  total,
  weeks,
}: ActivityHeatmapProps) {
  const width = weeks * (CELL + GAP)
  const height = 7 * (CELL + GAP)
  const gridRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)

  // pointer position relative to the grid container so the tooltip can be
  // absolutely positioned regardless of the svg's responsive scaling.
  const trackPointer = (e: { clientX: number; clientY: number }, n: number) => {
    const box = gridRef.current?.getBoundingClientRect()
    if (!box) return
    setHover({ x: e.clientX - box.left, y: e.clientY - box.top, n })
  }

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
        <div ref={gridRef} className="relative">
          <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            className="block"
          >
            {cells.map((level, i) => {
              const col = Math.floor(i / 7)
              const row = i % 7
              const n = counts?.[i]
              const interactive = n !== undefined
              return (
                <rect
                  key={i}
                  x={col * (CELL + GAP)}
                  y={row * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={LEVEL_COLORS[level]}
                  style={interactive ? { cursor: "pointer" } : undefined}
                  onMouseEnter={
                    interactive ? (e) => trackPointer(e, n) : undefined
                  }
                  onMouseMove={
                    interactive ? (e) => trackPointer(e, n) : undefined
                  }
                  onMouseLeave={interactive ? () => setHover(null) : undefined}
                />
              )
            })}
          </svg>

          {hover ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[color:var(--colorSoftBorder)] bg-[var(--colorPanel)] px-2 py-1 font-mono text-[11px] text-[var(--colorText)] shadow-md"
              style={{ left: hover.x, top: hover.y - 8 }}
            >
              {matchLabel(hover.n)}
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  )
}
