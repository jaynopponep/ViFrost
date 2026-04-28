import { cn } from "@/lib/utils"
import { SectionLabel } from "./section-label"

export interface StatBlockProps {
  label: string
  value: string | number
  sub?: string
  /** If true, the main number renders in cyan. Defaults to false (neutral text color). */
  accent?: boolean
  className?: string
}

export function StatBlock({
  label,
  value,
  sub,
  accent = false,
  className,
}: StatBlockProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[color:var(--colorSoftBorder)] bg-[var(--colorStatCard)] px-5 py-[18px]",
        className,
      )}
    >
      <SectionLabel>{label}</SectionLabel>
      <div
        className={cn(
          "mt-1.5 font-mono text-[22px] font-medium leading-none",
          accent
            ? "bg-clip-text text-transparent"
            : "text-[var(--colorText)]",
        )}
        style={
          accent
            ? {
                backgroundImage:
                  "linear-gradient(135deg, var(--colorCyan) 0%, var(--colorPink) 130%)",
              }
            : undefined
        }
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-xs text-[var(--colorTextMuted)]">{sub}</div>
      ) : null}
    </div>
  )
}
