import { PageShell } from "@/components/ui/page-shell"
import { Panel } from "@/components/ui/panel"
import { SectionLabel } from "@/components/ui/section-label"
import { AdminStatsCards } from "@/components/admin/AdminStatsCards"
import { AdminUserTable } from "@/components/admin/AdminUserTable"
import { useAdminStats, useAdminUsers } from "@/hooks/useAdminDashboard"

export function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } =
    useAdminStats()
  const { data: users, isLoading: usersLoading, error: usersError } =
    useAdminUsers()

  return (
    <PageShell>
      <header className="mb-8">
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-[var(--colorText)]">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--colorTextMuted)]">
          Review signups, manage user access, and assign administrator roles.
          All actions are enforced by Supabase row-level security.
        </p>
      </header>

      <AdminStatsCards stats={stats} isLoading={statsLoading} />

      {statsError ? (
        <p className="mt-4 text-sm text-[var(--colorDanger)]">
          {statsError.message}
        </p>
      ) : null}

      <Panel className="mt-8">
        <SectionLabel>User management</SectionLabel>
        <h2 className="mt-1 text-lg font-medium text-[var(--colorText)]">
          All accounts
        </h2>
        <div className="mt-5">
          <AdminUserTable users={users} isLoading={usersLoading} />
        </div>
        {usersError ? (
          <p className="mt-4 text-sm text-[var(--colorDanger)]">
            {usersError.message}
          </p>
        ) : null}
      </Panel>
    </PageShell>
  )
}
