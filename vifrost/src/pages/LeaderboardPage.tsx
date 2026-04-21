import { useOutletContext } from "react-router-dom"
import type { AppOutletContext } from "../App"
import { GlobalLeaderboardTile } from "../components/GlobalLeaderboardTile"
import { PageShell } from "../components/ui/page-shell"

export function LeaderboardPage() {
  const { username } = useOutletContext<AppOutletContext>()
  const safeName = username ?? "ArifMan"

  return (
    <PageShell>
      <GlobalLeaderboardTile currentUser={safeName} />
    </PageShell>
  )
}
