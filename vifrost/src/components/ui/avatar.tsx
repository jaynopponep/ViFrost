import { cn } from "@/lib/utils"

export interface AvatarProps {
  name: string
  size?: number
  className?: string
}

function hashHue(name: string): number {
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return sum % 360
}

export function Avatar({ name, size = 34, className }: AvatarProps) {
  const initial = (name.replace(/[^a-zA-Z]/g, "")[0] ?? "?").toUpperCase()
  const hue = hashHue(name)
  return (
    <div
      className={cn(
        "grid place-items-center rounded-lg border border-[color:var(--colorBorder)] font-mono uppercase",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        color: "var(--avatarInitial)",
        backgroundImage: `linear-gradient(135deg, oklch(var(--avatarL1) var(--avatarC1) ${hue}), oklch(var(--avatarL2) var(--avatarC2) ${hue}))`,
      }}
    >
      {initial}
    </div>
  )
}
