import { cn } from "@/lib/utils"
import { getTier } from "@/lib/tier"

export interface TierBadgeProps {
  rating: number
  className?: string
}

export function TierBadge({ rating, className }: TierBadgeProps) {
  const tier = getTier(rating)
  return (
    <span
      className={cn(
        "inline-block rounded-[4px] border px-2 py-[3px] font-mono text-[11px] font-medium tracking-[0.05em]",
        className,
      )}
      style={{
        borderColor: `${tier.color}66`,
        backgroundColor: `${tier.color}1a`,
        color: `color-mix(in srgb, ${tier.color} 55%, var(--colorText))`,
      }}
    >
      {tier.label}
    </span>
  )
}
