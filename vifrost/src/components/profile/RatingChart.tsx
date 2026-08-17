import { useMemo, useState } from "react"
import { Panel } from "../ui/panel"
import { SectionLabel } from "../ui/section-label"

export interface RatingChartProps {
  // the user's rating after each match, oldest -> newest.
  points: number[]
}

type Period = "7" | "30" | "90" | "All"
const PERIOD_TAIL: Record<Period, number> = { "7": 7, "30": 30, "90": 90, All: Infinity }

export function RatingChart({ points }: RatingChartProps) {
  const [period, setPeriod] = useState<Period>("90")

  const slice = useMemo(() => {
    const n = PERIOD_TAIL[period]
    return n === Infinity ? points : points.slice(-n)
  }, [period, points])

  const delta = useMemo(() => {
    if (slice.length < 2) return 0
    return Math.round(slice[slice.length - 1] - slice[0])
  }, [slice])

  const current = points.length ? points[points.length - 1] : 0

  const { path, area } = useMemo(() => {
    const w = 680,
      h = 180,
      pad = 8
    if (slice.length < 2) return { path: "", area: "" }
    const max = Math.max(...slice)
    const min = Math.min(...slice)
    const range = max - min || 1
    const pts = slice.map((v, i) => {
      const x = pad + (i / Math.max(slice.length - 1, 1)) * (w - pad * 2)
      const y = pad + (1 - (v - min) / range) * (h - pad * 2)
      return [x, y] as const
    })
    const path = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ")
    const area = `${path} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`
    return { path, area }
  }, [slice])

  return (
    <Panel>
      <div className="mb-3.5 flex items-baseline justify-between">
        <div>
          <SectionLabel>Rating · last {slice.length} matches</SectionLabel>
          {points.length >= 2 && (
            <div className="mt-1 font-mono text-[22px] text-[var(--colorText)]">
              {current.toLocaleString("en-US")}{" "}
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
          )}
        </div>
        <div className="flex gap-1">
          {(Object.keys(PERIOD_TAIL) as Period[]).map((p) => {
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
      {slice.length < 2 ? (
        <div className="grid h-[180px] place-items-center font-mono text-[12px] text-[var(--colorTextMuted)]">
          Not enough matches yet to chart rating.
        </div>
      ) : (
        <svg width="100%" viewBox="0 0 680 180" preserveAspectRatio="none" className="block">
          <defs>
            <linearGradient id="ratingFill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--colorCyan)" stopOpacity="0.32" />
              <stop offset="55%" stopColor="var(--colorCyan)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--colorPink)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="ratingStroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--colorCyan)" />
              <stop offset="100%" stopColor="var(--colorPink)" />
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
          <path d={path} fill="none" stroke="url(#ratingStroke)" strokeWidth="1.5" />
        </svg>
      )}
    </Panel>
  )
}
