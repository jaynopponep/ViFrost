import { useNavigate, useOutletContext } from "react-router-dom"
import type { AppOutletContext } from "../App"
import { useAuth } from "../contexts/AuthContext"
import { PlayerProfileTile } from "../components/PlayerProfileTile"
import { PageShell } from "../components/ui/page-shell"

export function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useOutletContext<AppOutletContext>()
  const { user, signOut } = useAuth()
  const safeName = username ?? "Guest"

  return (
    <PageShell>
      {user ? (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-[var(--colorBorder)] bg-[var(--colorSubtleBg)] px-4 py-2 font-mono text-sm font-medium text-[var(--colorText)] transition-colors hover:border-[var(--colorCyan)] hover:text-[var(--colorCyan)]"
            onClick={async () => {
              await signOut()
              navigate("/")
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
      <PlayerProfileTile username={safeName} user={user} />
    </PageShell>
  )
}
