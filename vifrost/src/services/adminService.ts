import { requireSupabase } from "@/lib/supabase"
import type { AdminStats, Profile, UserRole, UserStatus } from "@/types/profile"

export async function fetchAllProfiles(): Promise<Profile[]> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const sb = requireSupabase()
  const { data, error } = await sb.rpc("admin_get_stats")

  if (error) throw error
  return data as unknown as AdminStats
}

export async function moderateUser(
  targetId: string,
  newStatus: UserStatus,
): Promise<Profile> {
  const sb = requireSupabase()
  const { data, error } = await sb.rpc("admin_moderate_user", {
    target_id: targetId,
    new_status: newStatus,
  })

  if (error) throw error
  return data as Profile
}

export async function setUserRole(
  targetId: string,
  newRole: UserRole,
): Promise<Profile> {
  const sb = requireSupabase()
  const { data, error } = await sb.rpc("admin_set_user_role", {
    target_id: targetId,
    new_role: newRole,
  })

  if (error) throw error
  return data as Profile
}
