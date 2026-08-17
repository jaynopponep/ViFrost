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
import {
  readPersistedProfile,
  writePersistedProfile,
  clearPersistedProfile,
} from "@/lib/persistedProfile"
import type { Profile } from "@/types/profile"

export type ProfileContextValue = {
  profile: Profile | null
  isLoading: boolean
  error: Error | null
  isAdmin: boolean
  canAccessPlatform: boolean
  refreshProfile: () => Promise<void>
}

// localStorage is a stable per-origin singleton; resolve it once at
// module scope so it never churns hook dependency arrays.
const LS = typeof localStorage !== "undefined" ? localStorage : null

const ProfileContext = createContext<ProfileContextValue | null>(null)

export const profileQueryKey = (userId: string | undefined) =>
  ["profile", userId] as const

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  // seed synchronously from the last persisted profile so an
  // already-logged-in refresh renders without the full-page loader.
  // the stale savedAt makes react-query treat it as stale and
  // background-revalidate immediately; the ban effect still corrects.
  const seeded = useMemo(() => readPersistedProfile(LS, userId), [userId])

  const {
    data: profile = null,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
    initialData: seeded ? seeded.profile : undefined,
    initialDataUpdatedAt: seeded ? seeded.savedAt : undefined,
  })

  useEffect(() => {
    if (!user || isLoading || !profile) return
    if (profile.status === "banned") {
      void signOut()
    }
  }, [user, profile, isLoading, signOut])

  // mirror fresh query results into persisted storage so the next
  // reload can seed from them. clear it when the server says there is
  // no profile so we never seed a deleted one.
  useEffect(() => {
    if (!userId || isLoading) return
    // only persist data that actually came from a server fetch, not the
    // seeded value: rewriting the seed would bump savedAt and, because
    // the global staleTime is 30s, suppress the next reload's
    // revalidation. dataUpdatedAt only exceeds the seed's savedAt after
    // a real fetch resolves.
    if (dataUpdatedAt <= (seeded?.savedAt ?? 0)) return
    if (profile) writePersistedProfile(LS, userId, profile)
    else clearPersistedProfile(LS)
  }, [userId, isLoading, profile, dataUpdatedAt, seeded])

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

  // on sign-out clear the single shared profile key. note this is one
  // key per origin, so signing out drops any other tab's cached profile
  // too; cross-user reads are still safe because readPersistedProfile
  // matches on userId.
  useEffect(() => {
    if (!userId) {
      queryClient.removeQueries({ queryKey: ["profile"] })
      clearPersistedProfile(LS)
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
