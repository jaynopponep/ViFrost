import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useProfile } from "@/contexts/ProfileContext"
import { ProtectedRoute } from "./ProtectedRoute"

type AdminRouteProps = {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isLoading } = useProfile()

  return (
    <ProtectedRoute>
      {isLoading ? null : isAdmin ? (
        children
      ) : (
        <Navigate to="/unauthorized" replace />
      )}
    </ProtectedRoute>
  )
}
