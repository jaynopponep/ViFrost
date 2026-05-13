export interface CommandBarProps {
  label: string
  count: number
  pct: number
}

export function CommandBar({ label, count, pct }: CommandBarProps) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-16 shrink-0 font-mono text-[13px] text-[var(--colorCyan)]">
        {label}
      </div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--colorSoftBorder)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundImage:
              "linear-gradient(90deg, var(--colorCyan), color-mix(in srgb, var(--colorCyan) 53%, transparent))",
          }}
        />
      </div>
      <div className="w-10 text-right font-mono text-xs text-[var(--colorTextMuted)]">
        {count}
      </div>
    </div>
  )
}
