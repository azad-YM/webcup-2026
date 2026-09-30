import { afterEach, describe, expect, it, vi } from "vitest"
import { ItemHttpGateway } from "./item.http.gateway"

const item = { id: "item-id", name: "Premier", description: "", status: "active", createdAt: "2026-01-01T00:00:00+00:00" }

const setup = (token: string | null = "session-token") => {
  const session = {
    getToken: vi.fn(async () => {
      if (!token) throw new Error("no session")
      return token
    }),
    invalidate: vi.fn(),
  }
  return { session, gateway: new ItemHttpGateway("https://api.example.test/api", session) }
}

afterEach(() => vi.unstubAllGlobals())

describe("Example items HTTP contract", () => {
  it("calls the Example BC routes with the bearer token", async () => {
    const { gateway } = setup()
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([item])))
      .mockResolvedValueOnce(new Response(JSON.stringify(item)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...item, status: "archived" })))
      .mockResolvedValueOnce(new Response("null"))
    vi.stubGlobal("fetch", fetch)

    await expect(gateway.list()).resolves.toEqual([item])
    await gateway.create({ name: "Premier", description: "" })
    await gateway.update({ id: "item-id", name: "Premier", description: "", status: "archived" })
    await gateway.remove("item-id")

    const auth = { Authorization: "Bearer session-token" }
    const json = { ...auth, "Content-Type": "application/json" }
    expect(fetch).toHaveBeenNthCalledWith(1, "https://api.example.test/api/example/items", expect.objectContaining({ method: "GET", headers: auth }))
    expect(fetch).toHaveBeenNthCalledWith(2, "https://api.example.test/api/example/items", expect.objectContaining({ method: "POST", headers: json }))
    expect(fetch).toHaveBeenNthCalledWith(3, "https://api.example.test/api/example/items", expect.objectContaining({ method: "PUT", headers: json }))
    expect(fetch).toHaveBeenNthCalledWith(4, "https://api.example.test/api/example/items", expect.objectContaining({ method: "DELETE", body: JSON.stringify({ id: "item-id" }), headers: json }))
  })

  it("invalidates the session on 401", async () => {
    const { gateway, session } = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })))
    await expect(gateway.list()).rejects.toMatchObject({ kind: "unauthenticated" })
    expect(session.invalidate).toHaveBeenCalledOnce()
  })

  it("exposes the server message on 422 without disconnecting", async () => {
    const { gateway, session } = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "An item with this name already exists." }), { status: 422 })))
    await expect(gateway.create({ name: "Premier", description: "" })).rejects.toMatchObject({ kind: "invalid", message: "An item with this name already exists." })
    expect(session.invalidate).not.toHaveBeenCalled()
  })

  it.each([[403, "forbidden"], [404, "not-found"], [503, "unavailable"]])("maps HTTP %s to %s", async (status, kind) => {
    const { gateway } = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: status as number })))
    await expect(gateway.remove("item-id")).rejects.toMatchObject({ kind })
  })

  it("keeps the session on network failures", async () => {
    const { gateway, session } = setup()
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
    await expect(gateway.list()).rejects.toMatchObject({ kind: "unavailable" })
    expect(session.invalidate).not.toHaveBeenCalled()
  })
})
