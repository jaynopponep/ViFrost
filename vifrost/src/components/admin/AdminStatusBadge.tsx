import { cn } from "@/lib/utils"
import type { UserStatus } from "@/types/profile"

const STATUS_STYLES: Record<UserStatus, string> = {
  pending:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  banned: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  rejected:
    "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
}

type AdminStatusBadgeProps = {
  status: UserStatus
}

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  )
}
