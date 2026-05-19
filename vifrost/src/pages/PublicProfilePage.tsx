import { useParams } from "react-router-dom"
import { usePublicProfile } from "../hooks/usePublicProfile"
import { PlayerProfileTile } from "../components/PlayerProfileTile"
import { PageShell } from "../components/ui/page-shell"
import { Panel } from "../components/ui/panel"

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { profile, isLoading, isError, notFound } = usePublicProfile(userId)

  return (
    <PageShell>
      {isLoading ? (
        <Panel>
          <p className="m-0 text-sm text-[var(--colorTextMuted)]">
            Loading profile…
          </p>
        </Panel>
      ) : notFound ? (
        <Panel>
          <p className="m-0 text-sm text-[var(--colorTextMuted)]">
            Player not found.
          </p>
        </Panel>
      ) : isError || !profile ? (
        <Panel>
          <p className="m-0 text-sm text-[var(--colorTextMuted)]">
            Couldn't load this profile right now. Try again later.
          </p>
        </Panel>
      ) : (
        <PlayerProfileTile
          username={profile.display_name}
          publicProfile={profile}
        />
      )}
    </PageShell>
  )
}
