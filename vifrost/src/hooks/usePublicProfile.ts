import { useQuery } from "@tanstack/react-query"
import { fetchPublicProfile } from "@/services/matchService"
import type { PublicProfile } from "@/types/profile"

export const publicProfileQueryKey = (userId: string | undefined) =>
  ["publicProfile", userId ?? "none"] as const

export interface UsePublicProfileResult {
  profile: PublicProfile | null
  isLoading: boolean
  isError: boolean
  // true only once the query has resolved and returned no row (vs. still
  // loading or erroring) — drives the honest "Player not found" panel.
  notFound: boolean
}

// server i/o stays in services/hooks; the component consumes this hook only.
export function usePublicProfile(
  userId: string | undefined,
): UsePublicProfileResult {
  const q = useQuery({
    queryKey: publicProfileQueryKey(userId),
    queryFn: () => fetchPublicProfile(userId as string),
    enabled: !!userId,
  })
  return {
    profile: q.data ?? null,
    isLoading: q.isLoading,
    isError: q.isError,
    notFound: q.isSuccess && q.data == null,
  }
}
