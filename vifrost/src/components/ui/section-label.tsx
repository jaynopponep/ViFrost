import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type SectionLabelSize = "sm" | "md"

export interface SectionLabelProps {
  children: ReactNode
  /** `md` = 11px / 0.18em tracking (default). `sm` = 10px / 0.08em (denser, used above tables). */
  size?: SectionLabelSize
  className?: string
}

const SIZE_CLASSES: Record<SectionLabelSize, string> = {
  sm: "text-[10px] tracking-[0.08em]",
  md: "text-[11px] tracking-[0.18em]",
}

export function SectionLabel({
  children,
  size = "md",
  className,
}: SectionLabelProps) {
  return (
    <div
      className={cn(
        "font-mono font-semibold uppercase text-[var(--colorTextMuted)]",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </div>
  )
}
