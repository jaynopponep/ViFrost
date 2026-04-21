import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface PanelProps {
  children: ReactNode
  className?: string
}

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-[10px] border border-[color:var(--colorSoftBorder)] bg-[var(--colorPanel)] p-5",
        className,
      )}
    >
      {children}
    </section>
  )
}
