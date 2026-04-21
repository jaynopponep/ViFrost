const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "#f4d35e",
  2: "#c0c5cd",
  3: "#c89a72",
}

export interface RankMedalProps {
  rank: 1 | 2 | 3
}

export function RankMedal({ rank }: RankMedalProps) {
  const color = MEDAL_COLORS[rank]
  return (
    <div
      className="grid h-9 w-9 place-items-center rounded-lg border font-mono text-sm font-semibold"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}40, ${color}10)`,
        borderColor: `${color}60`,
        color,
        boxShadow: `0 0 16px ${color}30`,
      }}
    >
      {rank}
    </div>
  )
}
