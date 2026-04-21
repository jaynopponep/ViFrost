export type Tier = { label: string; color: string }

export function getTier(rating: number): Tier {
  if (rating >= 2100) return { label: "Grandmaster", color: "#c6b3ff" }
  if (rating >= 1850) return { label: "Master",      color: "#9de3f7" }
  if (rating >= 1700) return { label: "Diamond II",  color: "#8ecae6" }
  if (rating >= 1550) return { label: "Diamond I",   color: "#8ecae6" }
  if (rating >= 1400) return { label: "Platinum I",  color: "#5eead4" }
  if (rating >= 1200) return { label: "Gold",        color: "#f4d35e" }
  if (rating >= 1000) return { label: "Silver",      color: "#c0c5cd" }
  return                     { label: "Bronze",      color: "#c89a72" }
}
