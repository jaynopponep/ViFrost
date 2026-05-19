import { describe, it, expect } from "vitest";
import {
  readPersistedProfile,
  writePersistedProfile,
  clearPersistedProfile,
} from "./persistedProfile";
import type { Profile } from "@/types/profile";

// in-memory Storage-like with a mutable backing map.
function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    _map: map,
  };
}

const NOW = 1_700_000_000_000;

const profile: Profile = {
  id: "user-1",
  email: "a@b.c",
  full_name: "A B",
  role: "user",
  status: "approved",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
};

describe("persistedProfile", () => {
  it("returns null when storage is null/undefined", () => {
    expect(readPersistedProfile(null, "user-1", NOW)).toBeNull();
    expect(readPersistedProfile(undefined, "user-1", NOW)).toBeNull();
  });

  it("returns null when no userId is given", () => {
    const s = fakeStorage();
    writePersistedProfile(s, "user-1", profile, NOW);
    expect(readPersistedProfile(s, undefined, NOW)).toBeNull();
  });

  it("round-trips a written profile for the same user", () => {
    const s = fakeStorage();
    writePersistedProfile(s, "user-1", profile, NOW);
    const out = readPersistedProfile(s, "user-1", NOW);
    expect(out).not.toBeNull();
    expect(out!.profile).toEqual(profile);
    expect(out!.savedAt).toBe(NOW);
  });

  it("does not return another user's cached profile", () => {
    const s = fakeStorage();
    writePersistedProfile(s, "user-1", profile, NOW);
    expect(readPersistedProfile(s, "user-2", NOW)).toBeNull();
  });

  it("returns null for malformed stored JSON", () => {
    const s = fakeStorage({ "vifrost.profile": "{nope" });
    expect(readPersistedProfile(s, "user-1", NOW)).toBeNull();
  });

  it("rejects a cached blob missing required fields (email/role)", () => {
    const s = fakeStorage({
      "vifrost.profile": JSON.stringify({
        userId: "user-1",
        savedAt: NOW,
        profile: { id: "user-1", status: "approved" },
      }),
    });
    expect(readPersistedProfile(s, "user-1", NOW)).toBeNull();
  });

  it("returns null when the cache is older than maxAgeMs", () => {
    const s = fakeStorage();
    writePersistedProfile(s, "user-1", profile, NOW - 10_000);
    expect(readPersistedProfile(s, "user-1", NOW, 5_000)).toBeNull();
    // within the window it is still returned
    expect(readPersistedProfile(s, "user-1", NOW, 20_000)).not.toBeNull();
  });

  it("clearPersistedProfile removes the entry", () => {
    const s = fakeStorage();
    writePersistedProfile(s, "user-1", profile, NOW);
    clearPersistedProfile(s);
    expect(readPersistedProfile(s, "user-1", NOW)).toBeNull();
  });

  it("never throws if storage access fails", () => {
    const throwing = {
      get length(): number {
        throw new Error("denied");
      },
      key: () => null,
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(() => readPersistedProfile(throwing, "user-1", NOW)).not.toThrow();
    expect(readPersistedProfile(throwing, "user-1", NOW)).toBeNull();
    expect(() =>
      writePersistedProfile(throwing, "user-1", profile, NOW),
    ).not.toThrow();
    expect(() => clearPersistedProfile(throwing)).not.toThrow();
  });
});
