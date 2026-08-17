import type { Session } from "@supabase/supabase-js"

// supabase-js v2 persists the auth session in localStorage under a key
// like `sb-<projectRef>-auth-token` (default storage). reading it
// synchronously lets AuthContext start authed on refresh instead of
// flashing a full-page loader while the async getSession() resolves.
// this is optimistic: the async getSession()/onAuthStateChange still
// runs and corrects (sign-out / redirect) if the stored session is
// actually invalid server-side.

const AUTH_TOKEN_KEY_RE = /^sb-.*-auth-token$/

type StorageLike = {
  length: number
  key(index: number): string | null
  getItem(key: string): string | null
}

function extractSession(parsed: unknown): Session | null {
  if (!parsed || typeof parsed !== "object") return null
  const o = parsed as Record<string, unknown>
  // current v2 shape: the session object itself.
  if (o.access_token && o.user) return o as unknown as Session
  // legacy envelope: { currentSession, expiresAt }. the outer expiresAt
  // is intentionally ignored — the caller validates the inner session's
  // own expires_at, which is authoritative.
  if (o.currentSession && typeof o.currentSession === "object") {
    return o.currentSession as Session
  }
  return null
}

export function readPersistedSession(
  storage: StorageLike | null | undefined,
  nowMs: number = Date.now(),
): Session | null {
  if (!storage) return null
  try {
    let raw: string | null = null
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k && AUTH_TOKEN_KEY_RE.test(k)) {
        raw = storage.getItem(k)
        break
      }
    }
    if (!raw) return null

    const session = extractSession(JSON.parse(raw))
    if (!session) return null

    // expires_at is unix seconds. only treat a comfortably-valid session
    // as authed; an expired token must fall back to the async refresh
    // path so we never optimistically render a dead session.
    if (typeof session.expires_at !== "number") return null
    if (session.expires_at * 1000 <= nowMs) return null
    if (!session.access_token || !session.user) return null

    return session
  } catch {
    return null
  }
}
