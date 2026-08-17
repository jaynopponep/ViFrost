import { describe, it, expect } from "vitest";
import { readPersistedSession } from "./persistedSession";

// minimal in-memory Storage-like for the synchronous read.
function fakeStorage(entries: Record<string, string>) {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    key: (i: number) => keys[i] ?? null,
    getItem: (k: string) => (k in entries ? entries[k] : null),
  };
}

const NOW = 1_700_000_000_000; // fixed "now" in ms
const future = Math.floor(NOW / 1000) + 3600; // unix seconds, +1h
const past = Math.floor(NOW / 1000) - 3600; // unix seconds, -1h

function sessionJson(expires_at: number) {
  return JSON.stringify({
    access_token: "at",
    refresh_token: "rt",
    expires_at,
    token_type: "bearer",
    user: { id: "u1", email: "a@b.c" },
  });
}

describe("readPersistedSession", () => {
  it("returns null when storage is null/undefined", () => {
    expect(readPersistedSession(null, NOW)).toBeNull();
    expect(readPersistedSession(undefined, NOW)).toBeNull();
  });

  it("returns null when no sb-*-auth-token key exists", () => {
    const s = fakeStorage({ "unrelated-key": "x", "username": "joe" });
    expect(readPersistedSession(s, NOW)).toBeNull();
  });

  it("returns null when the stored value is malformed JSON", () => {
    const s = fakeStorage({ "sb-abc-auth-token": "{not json" });
    expect(readPersistedSession(s, NOW)).toBeNull();
  });

  it("returns null when the stored session is expired", () => {
    const s = fakeStorage({ "sb-abc-auth-token": sessionJson(past) });
    expect(readPersistedSession(s, NOW)).toBeNull();
  });

  it("returns null when the session lacks access_token or user", () => {
    const s = fakeStorage({
      "sb-abc-auth-token": JSON.stringify({ expires_at: future }),
    });
    expect(readPersistedSession(s, NOW)).toBeNull();
  });

  it("returns the session for a valid, non-expired sb-*-auth-token", () => {
    const s = fakeStorage({ "sb-proj123-auth-token": sessionJson(future) });
    const out = readPersistedSession(s, NOW);
    expect(out).not.toBeNull();
    expect(out!.access_token).toBe("at");
    expect(out!.user.id).toBe("u1");
  });

  it("returns null for a legacy envelope whose inner session is expired", () => {
    const s = fakeStorage({
      "sb-x-auth-token": JSON.stringify({
        currentSession: JSON.parse(sessionJson(past)),
        expiresAt: future, // outer is deliberately ignored
      }),
    });
    expect(readPersistedSession(s, NOW)).toBeNull();
  });

  it("unwraps the legacy { currentSession } envelope shape", () => {
    const s = fakeStorage({
      "sb-x-auth-token": JSON.stringify({
        currentSession: JSON.parse(sessionJson(future)),
        expiresAt: future,
      }),
    });
    const out = readPersistedSession(s, NOW);
    expect(out).not.toBeNull();
    expect(out!.user.id).toBe("u1");
  });
});
