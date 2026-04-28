import type { ReactNode } from "react"

export interface TileHeaderProps {
  title: string
  subtitle?: ReactNode
  /** Optional element rendered on the right (e.g., a status pill). */
  trailing?: ReactNode
}

export function TileHeader({ title, subtitle, trailing }: TileHeaderProps) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <h1 className="m-0 font-mono text-[32px] font-medium">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(110deg, var(--colorText) 0%, var(--colorCyan) 55%, var(--colorPink) 105%)",
            }}
          >
            {title}
          </span>
        </h1>
        {subtitle ? (
          <div className="mt-1.5 text-sm text-[var(--colorTextMuted)]">
            {subtitle}
          </div>
        ) : null}
      </div>
      {trailing}
    </div>
  )
}
