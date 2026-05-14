import { Settings, Share2 } from "lucide-react"
import { IconButton } from "../ui/icon-button"
import { TierBadge } from "../ui/tier-badge"

export interface ProfileHeaderProps {
  username: string
  handle: string
  joined: string
  bio: string
  rating: number
}

export function ProfileHeader({
  username,
  handle,
  joined,
  bio,
  rating,
}: ProfileHeaderProps) {
  const initial = (username[0] ?? "A").toUpperCase()
  return (
    <section
      className="flex items-center gap-7 rounded-[12px] border border-[color:var(--colorBorder)] bg-[var(--colorPanel)] p-7"
    >
      <div
        className="grid h-24 w-24 place-items-center rounded-2xl border font-mono text-[40px] font-medium text-[var(--colorCyan)]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--colorCyanDim), transparent)",
          borderColor: "var(--colorAccentBorder)",
          boxShadow:
            "0 0 40px var(--colorCyanGlow), inset 0 0 20px var(--colorAccentSoft)",
        }}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="m-0 font-mono text-[28px] font-medium leading-none text-[var(--colorText)]">
            {username}
          </h1>
          <TierBadge rating={rating} />
        </div>
        <div className="mt-1 font-mono text-[13px] text-[var(--colorTextMuted)]">
          {handle} · {joined}
        </div>
        <p className="mt-2.5 max-w-[520px] text-sm text-[var(--colorTextMuted)]">
          {bio}
        </p>
      </div>

      <div className="flex gap-2">
        <IconButton title="Share">
          <Share2 size={18} />
        </IconButton>
        <IconButton title="Settings">
          <Settings size={18} />
        </IconButton>
      </div>
    </section>
  )
}
