import { describe, expect, it } from "vitest"
import { filterPermissions, permissionContexts } from "./permission-options"
import { permissionKey } from "../../../core/domain/permission"

const permissions = [
  { context: "admin", resource: "role", action: "read" },
  { context: "admin", resource: "role-assignment", action: "write" },
  { context: "example", resource: "contract", action: "read" },
]

describe("Permission selection filters", () => {
  it("derives contexts from the full catalog", () => {
    expect(permissionContexts(permissions)).toEqual(["admin", "example"])
    expect(permissionContexts([])).toEqual([])
  })
  it("combines context and accent-insensitive search over labels and codes", () => {
    expect(filterPermissions(permissions, "  CREER roles ", "admin")).toEqual([permissions[1]])
    expect(filterPermissions(permissions, "read", "example")).toEqual([permissions[2]])
    expect(filterPermissions(permissions, "role", "example")).toEqual([])
    expect(filterPermissions(permissions, "", "")).toEqual(permissions)
  })
  it("keeps distinct triplets distinct even when they contain dots", () => {
    expect(permissionKey({ context: "a.b", resource: "c", action: "read" })).not.toBe(permissionKey({ context: "a", resource: "b.c", action: "read" }))
  })
})
