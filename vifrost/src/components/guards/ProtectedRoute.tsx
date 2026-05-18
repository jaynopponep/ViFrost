import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/contexts/ProfileContext"
import { Loader } from "@/components/ui/loader"
import { isSupabaseConfigured } from "@/lib/supabase"

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, isLoading: authLoading } = useAuth()
  const { isLoading: profileLoading } = useProfile()

  if (!isSupabaseConfigured()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (authLoading || (user && profileLoading)) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
