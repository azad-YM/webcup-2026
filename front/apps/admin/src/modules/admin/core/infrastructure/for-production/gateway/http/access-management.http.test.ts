import { afterEach, describe, expect, it, vi } from "vitest"
import { PermissionHttpGateway } from "./permission.http.gateway"
import { RoleHttpGateway } from "./role.http.gateway"
import { AuthAccessSessionProvider } from "@/modules/auth/core/infrastructure/adapter/admin/auth-access-session.provider"
import { createStore } from "@/modules/shared/core/config/store"
import { sessionCleared } from "@/modules/shared/core/config/session"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import { accessManagementApi } from "../../../../application/rtk-api/access-management"

const permissions = [
  { context: "admin", resource: "role", action: "read" },
  { context: "admin", resource: "member", action: "write" },
]

const setup = () => {
  const sessions = { getToken: vi.fn((): string | null => "session-token"), clear: vi.fn(), saveToken: vi.fn() }
  const onInvalidated = vi.fn()
  const session = new AuthAccessSessionProvider(sessions, onInvalidated)
  return {
    sessions, onInvalidated,
    permissionGateway: new PermissionHttpGateway("https://api.example.test/api/", session),
    roleGateway: new RoleHttpGateway("https://api.example.test/api", session),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe("Core access management HTTP contracts", () => {
  it("loads the admin catalog and sends the exact selected triplets through RTK Query", async () => {
    const gateways = setup()
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(permissions)))
      .mockResolvedValueOnce(new Response("null"))
    vi.stubGlobal("fetch", fetch)
    const store = createStore({ dependencies: gateways as unknown as Dependencies })
    const query = store.dispatch(accessManagementApi.endpoints.listPermissions.initiate("admin"))
    await expect(query.unwrap()).resolves.toEqual(permissions)
    const payload = { name: "Gestionnaire", permissions: permissions.slice(1) }
    const mutation = store.dispatch(accessManagementApi.endpoints.createRole.initiate(payload))
    await expect(mutation.unwrap()).resolves.toBeUndefined()
    expect(fetch).toHaveBeenNthCalledWith(1, "https://api.example.test/api/iam/permissions", expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer session-token" } }))
    expect(fetch).toHaveBeenNthCalledWith(2, "https://api.example.test/api/iam/roles", expect.objectContaining({ method: "POST", body: JSON.stringify(payload), headers: { Authorization: "Bearer session-token", "Content-Type": "application/json" } }))
    expect(accessManagementApi.endpoints.listPermissions.select("admin")(store.getState()).data).toEqual(permissions)
    store.dispatch(sessionCleared())
    expect(accessManagementApi.endpoints.listPermissions.select("admin")(store.getState()).data).toBeUndefined()
    expect(store.getState().accessManagementApi.mutations).toEqual({})
    query.unsubscribe()
    mutation.reset()
    store.dispatch(accessManagementApi.util.resetApiState())
  })

  it("invalidates the session on 401", async () => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    await expect(gateways.permissionGateway.list("admin")).rejects.toMatchObject({ kind: "unauthenticated" })
    expect(gateways.sessions.clear).toHaveBeenCalledOnce()
    expect(gateways.onInvalidated).toHaveBeenCalledOnce()
  })

  it.each([[403, "forbidden"], [422, "invalid"], [503, "unavailable"]])("reports HTTP %s without disconnecting", async (status, kind) => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{}', { status: status as number })))
    await expect(gateways.roleGateway.create({ name: "Role", permissions })).rejects.toMatchObject({ kind })
    expect(gateways.sessions.clear).not.toHaveBeenCalled()
  })

  it("keeps the session on network failures and permits a retry", async () => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(new Response("[]")))
    await expect(gateways.permissionGateway.list("admin")).rejects.toMatchObject({ kind: "unavailable" })
    await expect(gateways.permissionGateway.list("admin")).resolves.toEqual([])
    expect(gateways.sessions.clear).not.toHaveBeenCalled()
  })

  it("does not call the API without a session", async () => {
    const gateways = setup()
    gateways.sessions.getToken.mockReturnValue(null)
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    await expect(gateways.permissionGateway.list("admin")).rejects.toMatchObject({ kind: "unauthenticated" })
    expect(fetch).not.toHaveBeenCalled()
    expect(gateways.onInvalidated).toHaveBeenCalledOnce()
  })
})
