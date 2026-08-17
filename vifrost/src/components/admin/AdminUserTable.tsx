import { useMemo, useState } from "react"
import { useAdminMutations } from "@/hooks/useAdminDashboard"
import type { Profile } from "@/types/profile"
import { useAuth } from "@/contexts/AuthContext"
import {
  AdminUserFilters,
  filterUsersByStatus,
  type AdminUserFilter,
} from "./AdminUserFilters"
import { AdminUsersTable } from "./AdminUsersTable"

type AdminUserTableProps = {
  users: Profile[] | undefined
  isLoading: boolean
}

export function AdminUserTable({ users, isLoading }: AdminUserTableProps) {
  const [filter, setFilter] = useState<AdminUserFilter>("all")
  const { user: currentUser } = useAuth()
  const { moderate, setRole } = useAdminMutations()

  const filtered = useMemo(
    () => filterUsersByStatus(users ?? [], filter),
    [users, filter],
  )

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--colorTextMuted)]">
        Loading users…
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <AdminUserFilters value={filter} onChange={setFilter} />
      <AdminUsersTable
        users={filtered}
        currentUserId={currentUser?.id}
        isPending={moderate.isPending || setRole.isPending}
        onModerate={(userId, status) => moderate.mutate({ targetId: userId, status })}
        onSetRole={(userId, role) => setRole.mutate({ targetId: userId, role })}
      />
    </div>
  )
}
