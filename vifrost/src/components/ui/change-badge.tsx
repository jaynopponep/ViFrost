import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChangeBadgeProps {
  change: number
  className?: string
}

export function ChangeBadge({ change, className }: ChangeBadgeProps) {
  const positive = change > 0
  const zero = change === 0
  const color = zero
    ? "var(--colorTextMuted)"
    : positive
    ? "var(--colorCyan)"
    : "var(--colorDanger)"
  const Icon = zero ? Minus : positive ? ArrowUp : ArrowDown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs",
        className,
      )}
      style={{ color }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {Math.abs(change)}
    </span>
  )
}
