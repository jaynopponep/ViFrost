import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { canAccessPlatform, isAdmin } from "@/lib/access"
import { fetchProfile } from "@/services/profileService"
import type { Profile } from "@/types/profile"

export type ProfileContextValue = {
  profile: Profile | null
  isLoading: boolean
  error: Error | null
  isAdmin: boolean
  canAccessPlatform: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export const profileQueryKey = (userId: string | undefined) =>
  ["profile", userId] as const

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  const {
    data: profile = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  })

  useEffect(() => {
    if (!user || isLoading || !profile) return
    if (profile.status === "banned") {
      void signOut()
    }
  }, [user, profile, isLoading, signOut])

  const refreshProfile = useCallback(async () => {
    await refetch()
  }, [refetch])

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isLoading: Boolean(userId) && isLoading,
      error: error as Error | null,
      isAdmin: isAdmin(profile),
      canAccessPlatform: canAccessPlatform(profile),
      refreshProfile,
    }),
    [profile, userId, isLoading, error, refreshProfile],
  )

  useEffect(() => {
    if (!userId) {
      queryClient.removeQueries({ queryKey: ["profile"] })
    }
  }, [userId, queryClient])

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return ctx
}
