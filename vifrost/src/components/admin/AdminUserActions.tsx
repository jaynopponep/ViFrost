import { cn } from "@/lib/utils"
import type { Profile, UserRole, UserStatus } from "@/types/profile"

type AdminUserActionsProps = {
  profile: Profile
  isSelf: boolean
  isPending: boolean
  onModerate: (status: UserStatus) => void
  onSetRole: (role: UserRole) => void
}

export function AdminUserActions({
  profile,
  isSelf,
  isPending,
  onModerate,
  onSetRole,
}: AdminUserActionsProps) {
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

type ActionBtnProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "success" | "danger"
}

function ActionBtn({
  label,
  onClick,
  disabled,
  variant = "default",
}: ActionBtnProps) {
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
