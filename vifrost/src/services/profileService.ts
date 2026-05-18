import { requireSupabase } from "@/lib/supabase"
import type { Profile } from "@/types/profile"

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  return data as Profile | null
}

export async function updateOwnDisplayName(
  userId: string,
  fullName: string,
): Promise<Profile> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from("profiles")
    .update({ full_name: fullName.trim() || null })
    .eq("id", userId)
    .select("*")
    .single()

  if (error) throw error
  return data as Profile
}
