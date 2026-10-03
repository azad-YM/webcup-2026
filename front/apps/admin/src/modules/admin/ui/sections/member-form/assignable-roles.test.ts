import { describe, expect, it } from "vitest"
import { assignableRoles } from "./assignable-roles"
import { isInitialPasswordValid } from "../../../core/domain/member"

describe("Member form rules", () => {
  it("only proposes roles limited to the admin context", () => {
    const agent = { id: "agent", name: "Agent", permissions: [{ context: "admin", resource: "pilotage", action: "read" }] }
    const foreign = { id: "foreign", name: "Foreign", permissions: [{ context: "citizen", resource: "request", action: "read" }] }
    const empty = { id: "empty", name: "Empty", permissions: [] }
    expect(assignableRoles([agent, foreign, empty])).toEqual([agent, empty])
  })

  it("checks the initial password length like the API (8 characters, 72 bytes)", () => {
    expect(isInitialPasswordValid("1234567")).toBe(false)
    expect(isInitialPasswordValid("12345678")).toBe(true)
    expect(isInitialPasswordValid("a".repeat(72))).toBe(true)
    expect(isInitialPasswordValid("a".repeat(73))).toBe(false)
    expect(isInitialPasswordValid("é".repeat(37))).toBe(false)
  })
})
