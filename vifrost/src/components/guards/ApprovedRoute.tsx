import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useProfile } from "@/contexts/ProfileContext"
import { getStatusRedirectPath } from "@/lib/access"
import { ProtectedRoute } from "./ProtectedRoute"

type ApprovedRouteProps = {
  children: ReactNode
}

/** Requires authenticated user with approved status (admins bypass). */
export function ApprovedRoute({ children }: ApprovedRouteProps) {
  const location = useLocation()
  const { profile, isLoading, canAccessPlatform } = useProfile()

  return (
    <ProtectedRoute>
      {isLoading ? null : !canAccessPlatform ? (
        <Navigate
          to={getStatusRedirectPath(profile?.status) ?? "/pending"}
          replace
          state={{ from: location }}
        />
      ) : (
        children
      )}
    </ProtectedRoute>
  )
}
