import { cn } from "@/lib/utils"
import type { UserStatus } from "@/types/profile"

export const ADMIN_USER_FILTER_OPTIONS = [
  "all",
  "pending",
  "approved",
  "banned",
  "rejected",
] as const

export type AdminUserFilter = (typeof ADMIN_USER_FILTER_OPTIONS)[number]

type AdminUserFiltersProps = {
  value: AdminUserFilter
  onChange: (value: AdminUserFilter) => void
}

export function AdminUserFilters({ value, onChange }: AdminUserFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ADMIN_USER_FILTER_OPTIONS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            value === key
              ? "border-[var(--colorCyan)] bg-[var(--colorCyanDim)] text-[var(--colorCyan)]"
              : "border-[color:var(--colorSoftBorder)] text-[var(--colorTextMuted)] hover:text-[var(--colorText)]",
          )}
        >
          {key}
        </button>
      ))}
    </div>
  )
}

export function filterUsersByStatus<T extends { status: UserStatus }>(
  users: T[],
  filter: AdminUserFilter,
): T[] {
  if (filter === "all") return users
  return users.filter((u) => u.status === filter)
}
