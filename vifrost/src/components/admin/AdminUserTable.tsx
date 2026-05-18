import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useAdminMutations } from "@/hooks/useAdminDashboard"
import type { Profile, UserStatus } from "@/types/profile"
import { useAuth } from "@/contexts/AuthContext"

const STATUS_STYLES: Record<UserStatus, string> = {
  pending:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  banned: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  rejected:
    "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
}

type AdminUserTableProps = {
  users: Profile[] | undefined
  isLoading: boolean
}

export function AdminUserTable({ users, isLoading }: AdminUserTableProps) {
  const [filter, setFilter] = useState<"all" | UserStatus>("all")
  const { user: currentUser } = useAuth()
  const { moderate, setRole } = useAdminMutations()

  const filtered = useMemo(() => {
    if (!users) return []
    if (filter === "all") return users
    return users.filter((u) => u.status === filter)
  }, [users, filter])

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--colorTextMuted)]">
        Loading users…
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "banned", "rejected"] as const).map(
          (key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === key
                  ? "border-[var(--colorCyan)] bg-[var(--colorCyanDim)] text-[var(--colorCyan)]"
                  : "border-[color:var(--colorSoftBorder)] text-[var(--colorTextMuted)] hover:text-[var(--colorText)]",
              )}
            >
              {key}
            </button>
          ),
        )}
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-[color:var(--colorSoftBorder)]">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--colorSoftBorder)] bg-[var(--colorSurfaceAlt)]">
              <th className="px-4 py-3 font-medium text-[var(--colorTextMuted)]">
                Name
              </th>
              <th className="px-4 py-3 font-medium text-[var(--colorTextMuted)]">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-[var(--colorTextMuted)]">
                Role
              </th>
              <th className="px-4 py-3 font-medium text-[var(--colorTextMuted)]">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-[var(--colorTextMuted)]">
                Created
              </th>
              <th className="px-4 py-3 font-medium text-[var(--colorTextMuted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-[var(--colorTextMuted)]"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-[color:var(--colorSoftBorder)] last:border-0",
                    i % 2 === 1 && "bg-[var(--colorZebra)]",
                  )}
                >
                  <td className="px-4 py-3 font-medium">
                    {row.full_name ?? "—"}
                    {row.id === currentUser?.id ? (
                      <span className="ml-2 text-xs text-[var(--colorTextMuted)]">
                        (you)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--colorTextMuted)]">
                    {row.email}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                        STATUS_STYLES[row.status],
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--colorTextMuted)]">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <UserActions
                      profile={row}
                      isSelf={row.id === currentUser?.id}
                      onModerate={(status) =>
                        moderate.mutate({ targetId: row.id, status })
                      }
                      onSetRole={(role) =>
                        setRole.mutate({ targetId: row.id, role })
                      }
                      isPending={
                        moderate.isPending || setRole.isPending
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type UserActionsProps = {
  profile: Profile
  isSelf: boolean
  onModerate: (status: UserStatus) => void
  onSetRole: (role: "admin" | "user") => void
  isPending: boolean
}

function UserActions({
  profile,
  isSelf,
  onModerate,
  onSetRole,
  isPending,
}: UserActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {profile.status === "pending" ? (
        <ActionBtn
          label="Approve"
          variant="success"
          disabled={isPending}
          onClick={() => onModerate("approved")}
        />
      ) : null}
      {profile.status === "pending" ? (
        <ActionBtn
          label="Reject"
          disabled={isPending || isSelf}
          onClick={() => onModerate("rejected")}
        />
      ) : null}
      {profile.status !== "banned" ? (
        <ActionBtn
          label="Ban"
          variant="danger"
          disabled={isPending || isSelf}
          onClick={() => onModerate("banned")}
        />
      ) : (
        <ActionBtn
          label="Unban"
          variant="success"
          disabled={isPending}
          onClick={() => onModerate("approved")}
        />
      )}
      {profile.status === "rejected" ? (
        <ActionBtn
          label="Re-approve"
          variant="success"
          disabled={isPending}
          onClick={() => onModerate("approved")}
        />
      ) : null}
      {profile.role === "user" ? (
        <ActionBtn
          label="Make admin"
          disabled={isPending || profile.status !== "approved"}
          onClick={() => onSetRole("admin")}
        />
      ) : (
        <ActionBtn
          label="Remove admin"
          disabled={isPending || isSelf}
          onClick={() => onSetRole("user")}
        />
      )}
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "success" | "danger"
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40",
        variant === "success" &&
          "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
        variant === "danger" &&
          "border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300",
        variant === "default" &&
          "border-[color:var(--colorSoftBorder)] text-[var(--colorText)] hover:bg-[var(--colorSubtleBg)]",
      )}
    >
      {label}
    </button>
  )
}
