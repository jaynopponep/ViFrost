import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim()

/** `null` when env is missing — avoids `createClient("", "")` throwing at module load. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}
