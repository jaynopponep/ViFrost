import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/contexts/ProfileContext"
import { canAccessPlatform, getStatusRedirectPath, isAdmin } from "@/lib/access"

const AUTH_PATHS = new Set(["/login", "/signup"])

/** Redirects authenticated users away from login/signup to the right destination. */
export function AuthRedirect() {
  const { user, isLoading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading || (user && profileLoading)) return
    if (!user || !AUTH_PATHS.has(location.pathname)) return

    if (isAdmin(profile) || canAccessPlatform(profile)) {
      navigate("/", { replace: true })
      return
    }

    navigate(getStatusRedirectPath(profile?.status) ?? "/pending", {
      replace: true,
    })
  }, [
    user,
    profile,
    authLoading,
    profileLoading,
    location.pathname,
    navigate,
  ])

  return null
}
