import { StatBlock } from "@/components/ui/stat-block"
import type { AdminStats } from "@/types/profile"

type AdminStatsCardsProps = {
  stats: AdminStats | undefined
  isLoading: boolean
}

export function AdminStatsCards({ stats, isLoading }: AdminStatsCardsProps) {
  const display = (n: number | undefined) =>
    isLoading ? "…" : String(n ?? 0)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatBlock label="Total users" value={display(stats?.total)} accent />
      <StatBlock
        label="Pending approvals"
        value={display(stats?.pending)}
        sub="Awaiting review"
      />
      <StatBlock label="Approved users" value={display(stats?.approved)} />
      <StatBlock label="Banned users" value={display(stats?.banned)} />
    </div>
  )
}
