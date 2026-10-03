import { afterEach, describe, expect, it, vi } from "vitest"
import { MemberHttpGateway } from "./member.http.gateway"
import { RoleHttpGateway } from "./role.http.gateway"
import { AuthAccessSessionProvider } from "@/modules/auth/core/infrastructure/adapter/admin/auth-access-session.provider"
import { createStore } from "@/modules/shared/core/config/store"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import { accessManagementApi } from "../../../../application/rtk-api/access-management"

const roles = [{ id: "municipal-agent", name: "Agent municipal", permissions: [{ context: "admin", resource: "pilotage", action: "read" }] }]
const before = [{ id: "m1", userId: "u1", name: "Admin", roles: [{ id: "principal-administrator", name: "Administrateur principal" }], active: true }]
const after = [...before, { id: "m2", userId: "u2", name: "Camille", roles: [{ id: "municipal-agent", name: "Agent municipal" }], active: true }]

const setup = () => {
  const sessions = { getToken: vi.fn((): string | null => "session-token"), clear: vi.fn(), saveToken: vi.fn() }
  const session = new AuthAccessSessionProvider(sessions, vi.fn())
  return {
    sessions,
    memberGateway: new MemberHttpGateway("https://api.example.test/api", session),
    roleGateway: new RoleHttpGateway("https://api.example.test/api", session),
  }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

afterEach(() => vi.unstubAllGlobals())

describe("Members HTTP contracts", () => {
  it("lists roles and members, adds a member and refetches the member list", async () => {
    const gateways = setup()
    const fetch = vi.fn()
      .mockResolvedValueOnce(json(roles))
      .mockResolvedValueOnce(json(before))
      .mockResolvedValueOnce(json({ id: "m2", userId: "u2" }))
      .mockResolvedValueOnce(json(after))
    vi.stubGlobal("fetch", fetch)
    const store = createStore({ dependencies: gateways as unknown as Dependencies })

    const rolesQuery = store.dispatch(accessManagementApi.endpoints.listRoles.initiate())
    await expect(rolesQuery.unwrap()).resolves.toEqual(roles)
    const membersQuery = store.dispatch(accessManagementApi.endpoints.listMembers.initiate())
    await expect(membersQuery.unwrap()).resolves.toEqual(before)

    const payload = { name: "  Camille ", email: " camille@example.com ", password: "Initial-password-123", roleIds: ["municipal-agent", "municipal-agent"] }
    const mutation = store.dispatch(accessManagementApi.endpoints.addMember.initiate(payload))
    await expect(mutation.unwrap()).resolves.toEqual({ id: "m2", userId: "u2" })
    await vi.waitFor(() => expect(accessManagementApi.endpoints.listMembers.select()(store.getState()).data).toEqual(after))

    expect(fetch).toHaveBeenNthCalledWith(1, "https://api.example.test/api/administration/roles", expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer session-token" } }))
    expect(fetch).toHaveBeenNthCalledWith(2, "https://api.example.test/api/administration/members", expect.objectContaining({ method: "GET" }))
    expect(fetch).toHaveBeenNthCalledWith(3, "https://api.example.test/api/administration/members", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "Camille", email: "camille@example.com", password: "Initial-password-123", roleIds: ["municipal-agent"] }),
    }))
    expect(fetch).toHaveBeenCalledTimes(4)
    rolesQuery.unsubscribe()
    membersQuery.unsubscribe()
  })

  it("keeps the member list cached when the creation is refused", async () => {
    const gateways = setup()
    const fetch = vi.fn().mockResolvedValueOnce(json(before)).mockResolvedValueOnce(json({ error: "An account already exists for this email." }, 422))
    vi.stubGlobal("fetch", fetch)
    const store = createStore({ dependencies: gateways as unknown as Dependencies })
    const membersQuery = store.dispatch(accessManagementApi.endpoints.listMembers.initiate())
    await membersQuery.unwrap()
    const mutation = store.dispatch(accessManagementApi.endpoints.addMember.initiate({ name: "A", email: "a@example.com", password: "Initial-password-123", roleIds: ["r"] }))
    await expect(mutation.unwrap()).rejects.toMatchObject({ data: expect.stringContaining("e-mail") })
    expect(fetch).toHaveBeenCalledTimes(2)
    membersQuery.unsubscribe()
  })

  it.each([[403, "forbidden"], [422, "invalid"], [500, "unavailable"]])("reports HTTP %s on member creation without disconnecting", async (status, kind) => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, status as number)))
    await expect(gateways.memberGateway.add({ name: "A", email: "a@example.com", password: "Initial-password-123", roleIds: ["r"] })).rejects.toMatchObject({ kind })
    expect(gateways.sessions.clear).not.toHaveBeenCalled()
  })

  it("explains a 403 on the member list", async () => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 403)))
    await expect(gateways.memberGateway.list()).rejects.toMatchObject({ kind: "forbidden", message: expect.stringContaining("droits") })
  })
})
