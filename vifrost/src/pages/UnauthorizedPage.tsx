import { Link } from "react-router-dom"
import { PageShell } from "@/components/ui/page-shell"
import { Panel } from "@/components/ui/panel"
import "./AuthPages.css"

export function UnauthorizedPage() {
  return (
    <PageShell maxWidth="max-w-[560px]" className="auth-page">
      <Panel className="auth-card">
        <h1 className="auth-card__title">Unauthorized</h1>
        <p className="auth-card__subtitle">
          You do not have permission to view this page. Admin access is required.
        </p>
        <p className="auth-footer mt-6">
          <Link to="/">Back to home</Link>
        </p>
      </Panel>
    </PageShell>
  )
}
