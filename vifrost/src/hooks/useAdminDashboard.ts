import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { profileQueryKey } from "@/contexts/ProfileContext"
import {
  fetchAdminStats,
  fetchAllProfiles,
  moderateUser,
  setUserRole,
} from "@/services/adminService"
import type { UserRole, UserStatus } from "@/types/profile"
import { useAuth } from "@/contexts/AuthContext"

export const adminUsersQueryKey = ["admin", "users"] as const
export const adminStatsQueryKey = ["admin", "stats"] as const

function invalidateAdminQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: adminUsersQueryKey })
  void queryClient.invalidateQueries({ queryKey: adminStatsQueryKey })
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminStatsQueryKey,
    queryFn: fetchAdminStats,
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: fetchAllProfiles,
  })
}

export function useAdminMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const onSettled = () => invalidateAdminQueries(queryClient)

  const moderate = useMutation({
    mutationFn: ({
      targetId,
      status,
    }: {
      targetId: string
      status: UserStatus
    }) => moderateUser(targetId, status),
    onSuccess: (_data, { status }) => {
      toast.success(`User ${status}`)
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: profileQueryKey(user.id),
        })
      }
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled,
  })

  const setRole = useMutation({
    mutationFn: ({
      targetId,
      role,
    }: {
      targetId: string
      role: UserRole
    }) => setUserRole(targetId, role),
    onSuccess: (_data, { role }) => {
      toast.success(role === "admin" ? "Promoted to admin" : "Admin role removed")
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled,
  })

  return { moderate, setRole }
}
