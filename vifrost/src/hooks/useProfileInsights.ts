import { useQuery } from "@tanstack/react-query"
import {
  fetchMatchRecords,
  fetchPublicMatchRecords,
} from "@/services/matchService"
import { useLeaderboard } from "./useLeaderboard"
import {
  deriveAchievements,
  deriveActivityHeatmap,
  derivePercentile,
  deriveRatingTimeline,
  type AchievementView,
  type HeatmapData,
} from "@/lib/profileInsights"
import type { Profile, PublicProfile } from "@/types/profile"

export interface ProfileInsights {
  ratingPoints: number[]
  heatmap: HeatmapData
  achievements: AchievementView[]
  percentile: string | null
  isLoading: boolean
}

export type RecordSource = "own" | "public"

// pure: scoped react-query key so the auth-scoped own history and a public
// player's history never share a cache entry. exported for unit testing.
export function matchRecordsQuerySpec(
  userId: string | undefined,
  source: RecordSource = "own",
) {
  return {
    queryKey: ["matchRecords", source, userId ?? "anon"] as const,
    source,
  }
}

// one match-history fetch (own = auth.uid()-scoped get_match_history;
// public = get_public_match_history(userId)) + the shared leaderboard query,
// run through the tested pure derivations. server i/o stays in services/hooks.
export function useProfileInsights(
  userId: string | undefined,
  profile: Profile | PublicProfile | null,
  source: RecordSource = "own",
): ProfileInsights {
  const spec = matchRecordsQuerySpec(userId, source)
  const matches = useQuery({
    queryKey: spec.queryKey,
    queryFn: () =>
      spec.source === "public" && userId
        ? fetchPublicMatchRecords(userId)
        : fetchMatchRecords(),
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
