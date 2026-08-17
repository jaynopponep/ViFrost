import type { Profile, UserStatus } from "@/types/profile"

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === "admin" && profile?.status === "approved"
}

export function canAccessPlatform(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  if (isAdmin(profile)) return true
  return profile.status === "approved"
}

export function getStatusRedirectPath(
  status: UserStatus | undefined,
): string | null {
  switch (status) {
    case "pending":
      return "/pending"
    case "banned":
      return "/banned"
    case "rejected":
      return "/rejected"
    case "approved":
      return null
    default:
      return "/pending"
  }
}
