import { useQuery } from "@tanstack/react-query"
import { fetchMatchHistory } from "@/services/matchService"

export const matchHistoryQueryKey = (userId: string | undefined) =>
  ["matches", userId ?? "anon"] as const

export function useMatchHistory(userId: string | undefined) {
  return useQuery({
    queryKey: matchHistoryQueryKey(userId),
    queryFn: () => fetchMatchHistory(userId as string),
    enabled: !!userId,
  })
}
