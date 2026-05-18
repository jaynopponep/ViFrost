import type { Profile, UserRole, UserStatus } from "@/types/profile"
import { AdminTableHeadCell } from "./admin-table"
import { AdminUserRow } from "./AdminUserRow"

const TABLE_COLUMNS = [
  "Name",
  "Email",
  "Role",
  "Status",
  "Created",
  "Actions",
] as const

type AdminUsersTableProps = {
  users: Profile[]
  currentUserId: string | undefined
  isPending: boolean
  onModerate: (userId: string, status: UserStatus) => void
  onSetRole: (userId: string, role: UserRole) => void
}

export function AdminUsersTable({
  users,
  currentUserId,
  isPending,
  onModerate,
  onSetRole,
}: AdminUsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-[color:var(--colorSoftBorder)]">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-[color:var(--colorSoftBorder)] bg-[var(--colorSurfaceAlt)]">
            {TABLE_COLUMNS.map((label) => (
              <AdminTableHeadCell key={label}>{label}</AdminTableHeadCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <AdminUsersTableEmpty />
          ) : (
            users.map((profile, index) => (
              <AdminUserRow
                key={profile.id}
                profile={profile}
                rowIndex={index}
                currentUserId={currentUserId}
                isPending={isPending}
                onModerate={(status) => onModerate(profile.id, status)}
                onSetRole={(role) => onSetRole(profile.id, role)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function AdminUsersTableEmpty() {
  return (
    <tr>
      <td
        colSpan={TABLE_COLUMNS.length}
        className="px-4 py-10 text-center text-[var(--colorTextMuted)]"
      >
        No users found.
      </td>
    </tr>
  )
}
