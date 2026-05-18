import { cn } from "@/lib/utils"
import type { Profile, UserRole, UserStatus } from "@/types/profile"
import { AdminTableCell } from "./admin-table"
import { AdminStatusBadge } from "./AdminStatusBadge"
import { AdminUserActions } from "./AdminUserActions"

type AdminUserRowProps = {
  profile: Profile
  rowIndex: number
  currentUserId: string | undefined
  isPending: boolean
  onModerate: (status: UserStatus) => void
  onSetRole: (role: UserRole) => void
}

export function AdminUserRow({
  profile,
  rowIndex,
  currentUserId,
  isPending,
  onModerate,
  onSetRole,
}: AdminUserRowProps) {
  const isSelf = profile.id === currentUserId

  return (
    <tr
      className={cn(
        "border-b border-[color:var(--colorSoftBorder)] last:border-0",
        rowIndex % 2 === 1 && "bg-[var(--colorZebra)]",
      )}
    >
      <AdminTableCell className="font-medium">
        {profile.full_name ?? "—"}
        {isSelf ? (
          <span className="ml-2 text-xs text-[var(--colorTextMuted)]">(you)</span>
        ) : null}
      </AdminTableCell>
      <AdminTableCell className="text-[var(--colorTextMuted)]">
        {profile.email}
      </AdminTableCell>
      <AdminTableCell className="capitalize">{profile.role}</AdminTableCell>
      <AdminTableCell>
        <AdminStatusBadge status={profile.status} />
      </AdminTableCell>
      <AdminTableCell className="text-[var(--colorTextMuted)]">
        {new Date(profile.created_at).toLocaleDateString()}
      </AdminTableCell>
      <AdminTableCell>
        <AdminUserActions
          profile={profile}
          isSelf={isSelf}
          isPending={isPending}
          onModerate={onModerate}
          onSetRole={onSetRole}
        />
      </AdminTableCell>
    </tr>
  )
}
