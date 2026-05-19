export type QueueMode = "ranked" | "casual"

// resolves the queue mode from react-router location.state, set by the
// landing page's Casual/Ranked cards. anything other than an explicit
// "ranked" falls back to "casual" so direct or malformed navigation never
// silently joins the ranked ladder. mirrors the server's modeOrDefault.
export function resolveQueueMode(state: unknown): QueueMode {
  if (
    typeof state === "object" &&
    state !== null &&
    (state as { mode?: unknown }).mode === "ranked"
  ) {
    return "ranked"
  }
  return "casual"
}
