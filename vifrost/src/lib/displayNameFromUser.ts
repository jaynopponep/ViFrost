import type { User } from "@supabase/supabase-js"

type UserMeta = {
  username?: string
  full_name?: string
}

export function displayNameFromUser(user: User): string {
  const meta = user.user_metadata as UserMeta | undefined
  if (meta?.username && typeof meta.username === "string" && meta.username.trim()) {
    return meta.username.trim()
  }
  if (meta?.full_name && typeof meta.full_name === "string" && meta.full_name.trim()) {
    return meta.full_name.trim()
  }
  const email = user.email
  if (email?.includes("@")) {
    return email.split("@")[0] ?? "player"
  }
  return user.id.slice(0, 8)
}
