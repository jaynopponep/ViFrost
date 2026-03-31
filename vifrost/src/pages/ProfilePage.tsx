import { useOutletContext } from "react-router-dom"
import type { AppOutletContext } from "../App"
import { GlobalLeaderboardTile } from "../components/GlobalLeaderboardTile"
import { PlayerProfileTile } from "../components/PlayerProfileTile"

export function ProfilePage() {
  const { username } = useOutletContext<AppOutletContext>()
  const safeName = username ?? "ArifMan"

  return (
    <main className="w-full px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
        <PlayerProfileTile username={safeName} />
        <GlobalLeaderboardTile currentUser={safeName} />
      </div>
    </main>
  )
}
