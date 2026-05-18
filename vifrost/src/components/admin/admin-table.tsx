import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const adminTableHeadCellClass =
  "px-4 py-3 font-medium text-[var(--colorTextMuted)]"

export const adminTableCellClass = "px-4 py-3"

type AdminTableHeadCellProps = {
  children: ReactNode
  className?: string
}

export function AdminTableHeadCell({
  children,
  className,
}: AdminTableHeadCellProps) {
  return <th className={cn(adminTableHeadCellClass, className)}>{children}</th>
}

type AdminTableCellProps = {
  children: ReactNode
  className?: string
}

export function AdminTableCell({ children, className }: AdminTableCellProps) {
  return <td className={cn(adminTableCellClass, className)}>{children}</td>
}
