import { afterEach, describe, expect, it, vi } from "vitest"
import { createTestContext } from "@/test-support/test-dependencies"
import { AuthHttpGateway } from "../../infrastructure/for-production/gateway/http/auth.http.gateway"
import { authApi } from "./auth"

const credentials = { email: "admin@example.com", password: "password" }
const spaces = [{ code: "admin", name: "Administration", description: "Comptes, rôles et modules", roles: ["Administrateur principal"] }]
function setup() {
  let token: string | null = null
  const authSessionGateway = { getToken: () => token, saveToken: (value: string) => { token = value }, clear: () => { token = null } }
  const authGateway = new AuthHttpGateway("http://localhost:8083/api")
  return { authSessionGateway, authGateway, store: createTestContext({ authSessionGateway, authGateway }).store }
}
afterEach(() => vi.unstubAllGlobals())
describe("Connexion HTTP IAM", () => {
  it("persists the login response and loads actual spaces and roles", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ token: "signed-token" }))).mockResolvedValueOnce(new Response(JSON.stringify(spaces)))
    vi.stubGlobal("fetch", fetch)
    const { store, authSessionGateway } = setup()
    await store.dispatch(authApi.endpoints.loginWithCredentials.initiate(credentials)).unwrap()
    expect(authSessionGateway.getToken()).toBe("signed-token")
    expect(await store.dispatch(authApi.endpoints.listSpaces.initiate(undefined, { subscribe: false })).unwrap()).toEqual(spaces)
    expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8083/api/login_check", expect.objectContaining({ method: "POST", body: JSON.stringify(credentials) }))
    expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8083/api/iam/me/spaces", expect.objectContaining({ headers: { Authorization: "Bearer signed-token" } }))
    store.dispatch(authApi.util.resetApiState())
  })
  it("rejects invalid credentials without saving a token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    const { store, authSessionGateway } = setup()
    await expect(store.dispatch(authApi.endpoints.loginWithCredentials.initiate(credentials)).unwrap()).rejects.toMatchObject({ status: 401 })
    expect(authSessionGateway.getToken()).toBeNull()
  })
  it("rejects catalog access without a session", async () => {
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const { store } = setup()
    await expect(store.dispatch(authApi.endpoints.listSpaces.initiate(undefined, { subscribe: false })).unwrap()).rejects.toMatchObject({ status: 401 })
    expect(fetch).not.toHaveBeenCalled()
    store.dispatch(authApi.util.resetApiState())
  })
  it("preserves the session on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
    const { store, authSessionGateway } = setup()
    authSessionGateway.saveToken("existing-token")
    await expect(store.dispatch(authApi.endpoints.listSpaces.initiate(undefined, { subscribe: false })).unwrap()).rejects.toMatchObject({ status: "NETWORK_ERROR" })
    expect(authSessionGateway.getToken()).toBe("existing-token")
    store.dispatch(authApi.util.resetApiState())
  })
  it("requests a destination-bound code with the PKCE challenge", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "single-use-code" })))
    vi.stubGlobal("fetch", fetch)
    const { store, authSessionGateway } = setup()
    authSessionGateway.saveToken("site-token")
    await expect(store.dispatch(authApi.endpoints.issuePortalCode.initiate("challenge")).unwrap()).resolves.toEqual({ code: "single-use-code" })
    expect(fetch).toHaveBeenCalledWith("http://localhost:8083/api/iam/portal-codes", expect.objectContaining({ body: JSON.stringify({ destination: "admin", challenge: "challenge" }), headers: { Authorization: "Bearer site-token", "Content-Type": "application/json" } }))
  })
})
