import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface PageShellProps {
  children: ReactNode
  /** Tailwind max-width utility for the inner container. Defaults to `max-w-[1200px]`. */
  maxWidth?: string
  className?: string
}

export function PageShell({
  children,
  maxWidth = "max-w-[1200px]",
  className,
}: PageShellProps) {
  return (
    <main className={cn("w-full px-12 pt-8 pb-20", className)}>
      <div className={cn("mx-auto w-full", maxWidth)}>{children}</div>
    </main>
  )
}
