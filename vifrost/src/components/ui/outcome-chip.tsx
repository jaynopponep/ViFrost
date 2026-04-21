import { cn } from "@/lib/utils"

export type MatchOutcome = "W" | "L" | "D"

export interface OutcomeChipProps {
  outcome: MatchOutcome
  className?: string
}

const OUTCOME_STYLE: Record<MatchOutcome, {
  bg: string
  border: string
  color: string
  label: string
}> = {
  W: {
    bg: "color-mix(in srgb, var(--colorCyan) 18%, transparent)",
    border: "color-mix(in srgb, var(--colorCyan) 50%, transparent)",
    color: "var(--colorCyan)",
    label: "Win",
  },
  L: {
    bg: "color-mix(in srgb, var(--colorDanger) 14%, transparent)",
    border: "color-mix(in srgb, var(--colorDanger) 45%, transparent)",
    color: "var(--colorDanger)",
    label: "Loss",
  },
  D: {
    bg: "rgba(234, 179, 8, 0.14)",
    border: "rgba(234, 179, 8, 0.45)",
    color: "#ca8a04",
    label: "Draw",
  },
}

export function OutcomeChip({ outcome, className }: OutcomeChipProps) {
  const s = OUTCOME_STYLE[outcome]
  return (
    <div
      className={cn(
        "rounded-[5px] border py-[5px] text-center font-mono text-[11px] font-semibold tracking-[0.08em]",
        className,
      )}
      style={{
        width: 60,
        backgroundColor: s.bg,
        borderColor: s.border,
        color: s.color,
      }}
    >
      {s.label}
    </div>
  )
}
