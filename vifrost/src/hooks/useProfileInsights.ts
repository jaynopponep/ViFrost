import { useQuery } from "@tanstack/react-query"
import { fetchMatchRecords } from "@/services/matchService"
import { useLeaderboard } from "./useLeaderboard"
import {
  deriveAchievements,
  deriveActivityHeatmap,
  derivePercentile,
  deriveRatingTimeline,
  type AchievementView,
  type HeatmapData,
} from "@/lib/profileInsights"
import type { Profile } from "@/types/profile"

export interface ProfileInsights {
  ratingPoints: number[]
  heatmap: HeatmapData
  achievements: AchievementView[]
  percentile: string | null
  isLoading: boolean
}

export const matchRecordsQueryKey = (userId: string | undefined) =>
  ["matchRecords", userId ?? "anon"] as const

// one get_match_history fetch (raw records) + the shared leaderboard query,
// run through the tested pure derivations. server I/O stays in hooks.
export function useProfileInsights(
  userId: string | undefined,
  profile: Profile | null,
): ProfileInsights {
  const matches = useQuery({
    queryKey: matchRecordsQueryKey(userId),
    queryFn: fetchMatchRecords,
    enabled: !!userId,
  })
  const leaderboard = useLeaderboard()

  const records = matches.data ?? []
  const rows = leaderboard.data ?? []

  return {
    ratingPoints: userId ? deriveRatingTimeline(records, userId) : [],
    heatmap: deriveActivityHeatmap(records),
    achievements: deriveAchievements(profile, records),
    percentile: userId ? derivePercentile(rows, userId) : null,
    isLoading: matches.isLoading || leaderboard.isLoading,
  }
}
