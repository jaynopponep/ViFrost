import { useOutletContext } from "react-router-dom"
import type { AppOutletContext } from "../App"
import { PlayerProfileTile } from "../components/PlayerProfileTile"
import { PageShell } from "../components/ui/page-shell"

export function ProfilePage() {
  const { username } = useOutletContext<AppOutletContext>()
  const safeName = username ?? "ArifMan"

  return (
    <PageShell>
      <PlayerProfileTile username={safeName} />
    </PageShell>
  )
}
