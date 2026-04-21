import { useMemo, useState } from "react"
import { Panel } from "../ui/panel"
import { SectionLabel } from "../ui/section-label"

const CURRENT_RATING = 1482

// Deterministic rating history (120 points). Module-load; never changes.
const RATING_HISTORY: number[] = (() => {
  const points: number[] = []
  let r = 1200
  for (let i = 0; i < 120; i++) {
    const noise = Math.sin(i * 1.8) * 22 + Math.sin(i * 0.47) * 14
    r += noise * 0.3 + 1.8
    r = Math.max(900, Math.min(1650, r))
    points.push(r)
  }
  points.push(CURRENT_RATING)
  return points
})()

type Period = "7d" | "30d" | "90d" | "All"
const PERIOD_SLICE: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  All: RATING_HISTORY.length,
}

export function RatingChart() {
  const [period, setPeriod] = useState<Period>("90d")

  const slice = useMemo(() => {
    const n = PERIOD_SLICE[period]
    return RATING_HISTORY.slice(-n)
  }, [period])

  const delta = useMemo(() => {
    if (slice.length < 2) return 0
    return Math.round(slice[slice.length - 1] - slice[0])
  }, [slice])

  const { path, area } = useMemo(() => {
    const w = 680,
      h = 180,
      pad = 8
    if (slice.length === 0) return { path: "", area: "" }
    const max = Math.max(...slice)
    const min = Math.min(...slice)
    const range = max - min || 1
    const pts = slice.map((v, i) => {
      const x = pad + (i / Math.max(slice.length - 1, 1)) * (w - pad * 2)
      const y = pad + (1 - (v - min) / range) * (h - pad * 2)
      return [x, y] as const
    })
    const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
    const area = `${path} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`
    return { path, area }
  }, [slice])

  return (
    <Panel>
      <div className="mb-3.5 flex items-baseline justify-between">
        <div>
          <SectionLabel>Rating · last {slice.length} matches</SectionLabel>
          <div className="mt-1 font-mono text-[22px] text-[var(--colorText)]">
            {CURRENT_RATING.toLocaleString("en-US")}{" "}
            <span
              className="text-[13px]"
              style={{
                color:
                  delta > 0
                    ? "var(--colorCyan)"
                    : delta < 0
                    ? "var(--colorDanger)"
                    : "var(--colorTextMuted)",
              }}
            >
              {delta > 0 ? "+" : ""}
              {delta} {delta > 0 ? "↑" : delta < 0 ? "↓" : ""}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(Object.keys(PERIOD_SLICE) as Period[]).map((p) => {
            const active = p === period
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className="cursor-pointer rounded-[5px] border px-2.5 py-1 font-mono text-[11px]"
                style={{
                  backgroundColor: active ? "var(--colorAccentSoft)" : "transparent",
                  borderColor: active ? "var(--colorAccentBorder)" : "var(--colorBorder)",
                  color: active ? "var(--colorCyan)" : "var(--colorTextMuted)",
                }}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>
      <svg
        width="100%"
        viewBox="0 0 680 180"
        preserveAspectRatio="none"
        className="block"
      >
        <defs>
          <linearGradient id="ratingFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--colorCyan)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--colorCyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={8}
            x2={672}
            y1={8 + f * 164}
            y2={8 + f * 164}
            stroke="var(--colorBorder)"
            strokeDasharray="2 4"
          />
        ))}
        <path d={area} fill="url(#ratingFill)" />
        <path d={path} fill="none" stroke="var(--colorCyan)" strokeWidth="1.5" />
      </svg>
    </Panel>
  )
}
