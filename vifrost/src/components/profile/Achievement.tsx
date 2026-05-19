import { cn } from "@/lib/utils"

export interface AchievementProps {
  glyph: string
  title: string
  sub: string
  earned: boolean
  // true = no backing data is captured for this criterion yet. renders
  // dimmed with a native tooltip; never shows earned styling.
  locked?: boolean
}

export function Achievement({
  glyph,
  title,
  sub,
  earned,
  locked = false,
}: AchievementProps) {
  return (
    <div
      title={locked ? "Criteria not tracked yet" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        earned && !locked
          ? "border-[color:var(--colorAccentBorder)]"
          : "border-[color:var(--colorBorder)] opacity-45",
      )}
      style={
        earned && !locked
          ? {
              backgroundImage:
                "linear-gradient(135deg, var(--colorCyanDim) 0%, var(--colorAccentSoft) 35%, transparent 90%)",
            }
          : undefined
      }
    >
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border font-mono text-sm font-semibold",
          earned && !locked
            ? "border-[color:var(--colorAccentBorder)] bg-[var(--colorCyanDim)] text-[var(--colorCyan)]"
            : "border-[color:var(--colorBorder)] bg-[var(--colorSubtleBg)] text-[var(--colorTextMuted)]",
        )}
      >
        {glyph}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs text-[var(--colorText)]">{title}</div>
        <div className="mt-0.5 text-[11px] text-[var(--colorTextMuted)]">
          {sub}
        </div>
      </div>
    </div>
  )
}
