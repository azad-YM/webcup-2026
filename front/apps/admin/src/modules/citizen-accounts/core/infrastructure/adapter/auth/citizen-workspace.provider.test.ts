import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpCitizenWorkspaceProvider } from "./citizen-workspace.provider"

const session = () => ({ getToken: vi.fn(async () => "admin-jwt"), invalidate: vi.fn() })
afterEach(() => vi.unstubAllGlobals())

describe("Espace citoyen du compte connecté à l’admin", () => {
  it("vérifie le profil avec la session courante sans transmettre ses données à Auth", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "citizen", firstName: "Ada" })))
    vi.stubGlobal("fetch", fetch)
    expect(await new HttpCitizenWorkspaceProvider("/api", session()).isAvailable()).toBe(true)
    expect(fetch.mock.calls[0]![0]).toBe("/api/citizen/me")
    expect(fetch.mock.calls[0]![1].headers.Authorization).toBe("Bearer admin-jwt")
  })
  it("masque l’espace pour un compte sans profil citoyen", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
    const access = session()
    expect(await new HttpCitizenWorkspaceProvider("/api", access).isAvailable()).toBe(false)
    expect(access.invalidate).not.toHaveBeenCalled()
  })
  it("invalide une session expirée", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    const access = session()
    await expect(new HttpCitizenWorkspaceProvider("/api", access).isAvailable()).rejects.toThrow("Réessayez")
    expect(access.invalidate).toHaveBeenCalledOnce()
  })
  it.each([403, 500])("conserve la session et signale une erreur pour HTTP %s", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{}', { status })))
    const access = session()
    await expect(new HttpCitizenWorkspaceProvider("/api", access).isAvailable()).rejects.toThrow("Réessayez")
    expect(access.invalidate).not.toHaveBeenCalled()
  })
  it("ne confond pas une panne réseau et l’absence d’espace citoyen", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")))
    const access = session()
    await expect(new HttpCitizenWorkspaceProvider("/api", access).isAvailable()).rejects.toThrow("Réessayez")
    expect(access.invalidate).not.toHaveBeenCalled()
  })
})
