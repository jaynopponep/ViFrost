import { describe, it, expect } from "vitest"
import { resolveQueueMode } from "./resolveQueueMode"

describe("resolveQueueMode", () => {
  it("returns casual when the landing passed mode casual", () => {
    expect(resolveQueueMode({ mode: "casual" })).toBe("casual")
  })

  it("returns ranked when the landing passed mode ranked", () => {
    expect(resolveQueueMode({ mode: "ranked" })).toBe("ranked")
  })

  it("defaults to casual when no router state is present", () => {
    // direct navigation to /lobby (not via a landing card) must not
    // silently land the player on the ranked ladder.
    expect(resolveQueueMode(null)).toBe("casual")
    expect(resolveQueueMode(undefined)).toBe("casual")
  })

  it("defaults to casual for malformed or unknown state", () => {
    expect(resolveQueueMode({})).toBe("casual")
    expect(resolveQueueMode({ mode: "ranked-ish" })).toBe("casual")
    expect(resolveQueueMode("ranked")).toBe("casual")
    expect(resolveQueueMode({ mode: 123 })).toBe("casual")
  })
})
