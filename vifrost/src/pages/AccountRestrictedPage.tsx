import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { PageShell } from "@/components/ui/page-shell"
import { Panel } from "@/components/ui/panel"
import "./AuthPages.css"

type AccountRestrictedPageProps = {
  title: string
  message: string
}

export function AccountRestrictedPage({
  title,
  message,
}: AccountRestrictedPageProps) {
  const { signOut } = useAuth()

  return (
    <PageShell maxWidth="max-w-[560px]" className="auth-page">
      <Panel className="auth-card">
        <h1 className="auth-card__title">{title}</h1>
        <p className="auth-card__subtitle">{message}</p>
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

export function BannedPage() {
  return (
    <AccountRestrictedPage
      title="Account banned"
      message="Your account has been banned from ViFrost. Contact support if you believe this is a mistake."
    />
  )
}

export function RejectedPage() {
  return (
    <AccountRestrictedPage
      title="Account rejected"
      message="Your registration was not approved. You cannot use the platform with this account."
    />
  )
}
