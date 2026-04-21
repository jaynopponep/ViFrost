import { cn } from "@/lib/utils"

export interface AchievementProps {
  glyph: string
  title: string
  sub: string
  earned: boolean
}

export function Achievement({ glyph, title, sub, earned }: AchievementProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        earned
          ? "border-[color:var(--colorAccentBorder)] bg-[var(--colorAccentSoft)]"
          : "border-[color:var(--colorBorder)] opacity-45",
      )}
    >
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border font-mono text-sm font-semibold",
          earned
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
