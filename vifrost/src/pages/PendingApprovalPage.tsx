import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/contexts/ProfileContext"
import { PageShell } from "@/components/ui/page-shell"
import { Panel } from "@/components/ui/panel"
import "./AuthPages.css"

export function PendingApprovalPage() {
  const { signOut, user } = useAuth()
  const { canAccessPlatform, isLoading } = useProfile()

  if (!isLoading && canAccessPlatform) {
    return <Navigate to="/" replace />
  }

  return (
    <PageShell maxWidth="max-w-[560px]" className="auth-page">
      <Panel className="auth-card !border-[color:var(--colorAccentBorder)]">
        <h1 className="auth-card__title">Awaiting approval</h1>
        <p className="auth-card__subtitle">
          Your account is awaiting admin approval. You will be able to access
          matchmaking and other features once an administrator approves your
          account.
        </p>
        {user?.email ? (
          <p className="mt-4 text-sm text-[var(--colorTextMuted)]">
            Signed in as{" "}
            <strong className="text-[var(--colorText)]">{user.email}</strong>
          </p>
        ) : null}
        <button
          type="button"
          className="auth-submit mt-6"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
        <p className="auth-footer mt-4">
          <Link to="/">Back to home</Link>
        </p>
      </Panel>
    </PageShell>
  )
}
