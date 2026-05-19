import type { Profile } from "@/types/profile"

// the profile react-query has no cross-reload cache, so every refresh
// refetches it over the network while ProtectedRoute shows a full-page
// loader (the "quick flash"). persisting the last-known profile lets the
// query seed `initialData` synchronously so the first paint is already
// rendered; react-query still background-revalidates and the existing
// ban effect still corrects. symmetric with readPersistedSession.

const PROFILE_KEY = "vifrost.profile"

// generous bound: a seed older than this is ignored so a long-offline
// reload doesn't render very stale status. normal use revalidates in
// well under a second, so this only matters for stale/offline edges.
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type StorageLike = {
  length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

type Stored = { userId: string; profile: Profile; savedAt: number }

function isProfile(v: unknown): v is Profile {
  if (!v || typeof v !== "object") return false
  const p = v as Record<string, unknown>
  // a cached profile can only originate from a real fetch, so a thin
  // check is enough — but validate the fields consumers actually read
  // (status/role gate access; email/id identify) so a corrupt blob is
  // dropped rather than seeded.
  return (
    typeof p.id === "string" &&
    typeof p.email === "string" &&
    typeof p.role === "string" &&
    typeof p.status === "string"
  )
}

export function readPersistedProfile(
  storage: StorageLike | null | undefined,
  userId: string | undefined,
  nowMs: number = Date.now(),
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): { profile: Profile; savedAt: number } | null {
  if (!storage || !userId) return null
  try {
    const raw = storage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const s = parsed as Partial<Stored>
    if (s.userId !== userId) return null
    if (typeof s.savedAt !== "number") return null
    if (nowMs - s.savedAt > maxAgeMs) return null
    if (!isProfile(s.profile)) return null
    return { profile: s.profile, savedAt: s.savedAt }
  } catch {
    return null
  }
}

export function writePersistedProfile(
  storage: StorageLike | null | undefined,
  userId: string | undefined,
  profile: Profile,
  nowMs: number = Date.now(),
): void {
  if (!storage || !userId) return
  try {
    const payload: Stored = { userId, profile, savedAt: nowMs }
    storage.setItem(PROFILE_KEY, JSON.stringify(payload))
  } catch {
    // storage unavailable (private mode / quota) — the in-memory query
    // still works; we just lose the cross-reload optimization.
  }
}

export function clearPersistedProfile(
  storage: StorageLike | null | undefined,
): void {
  if (!storage) return
  try {
    storage.removeItem(PROFILE_KEY)
  } catch {
    // ignore — see writePersistedProfile.
  }
}
