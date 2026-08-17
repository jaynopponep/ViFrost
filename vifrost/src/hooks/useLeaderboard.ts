import { useQuery } from "@tanstack/react-query"
import { fetchLeaderboard } from "@/services/matchService"

export const leaderboardQueryKey = ["leaderboard"] as const

export function useLeaderboard() {
  return useQuery({
    queryKey: leaderboardQueryKey,
    queryFn: fetchLeaderboard,
  })
}
