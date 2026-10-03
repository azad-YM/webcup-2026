import { afterEach, describe, expect, it, vi } from "vitest"
import { CitizenErrorCode } from "../../../../application/ports/gateway/citizen.gateway"
import { CitizenHttpGateway } from "./citizen.http.gateway"

const API = "http://localhost:8083/api"
const profile = {
  id: "0b6f8c1e-0000-4000-8000-000000000001",
  firstName: null, lastName: null, phone: null, address: null, district: null, preferredLanguage: null,
  registeredAt: "2026-10-03T14:30:00+00:00",
  profileCompleted: false
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

afterEach(() => vi.unstubAllGlobals())

describe("Contrat HTTP Citizen (lot L1)", () => {
  const gateway = new CitizenHttpGateway(API)

  it("POST /api/citizen/register avec e-mail et mot de passe", async () => {
    const fetch = vi.fn().mockResolvedValue(json({ citizenId: "c-1" }))
    vi.stubGlobal("fetch", fetch)
    await expect(gateway.register({ email: "ada@nova-terra.fr", password: "motdepasse" })).resolves.toEqual({ citizenId: "c-1" })
    expect(fetch).toHaveBeenCalledWith(`${API}/citizen/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ada@nova-terra.fr", password: "motdepasse" })
    })
  })

  it("409 : e-mail déjà utilisé", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error: "Account already exists" }, 409)))
    await expect(gateway.register({ email: "ada@nova-terra.fr", password: "motdepasse" }))
      .rejects.toMatchObject({ status: 409, message: "Un compte existe déjà avec cet e-mail.", details: { code: CitizenErrorCode.emailAlreadyUsed } })
  })

  it("422 : message compréhensible, sans le texte technique, avec le champ visé", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ path: "password", message: "This value is too short." }, 422)))
    const error = await gateway.register({ email: "ada@nova-terra.fr", password: "x" }).catch((reason) => reason)
    expect(error).toMatchObject({ status: 422, details: { code: CitizenErrorCode.invalidPayload, field: "password" } })
    expect(error.message).not.toContain("too short")
    expect(error.message).toMatch(/8 à 72 caractères/)
  })

  it("422 au format { error } (refus résiduel IAM) : message générique", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error: "Account creation rejected" }, 422)))
    const error = await gateway.register({ email: "ada@nova-terra.fr", password: "motdepasse" }).catch((reason) => reason)
    expect(error).toMatchObject({ status: 422, details: { code: CitizenErrorCode.invalidPayload, field: undefined } })
    expect(error.message).not.toContain("rejected")
  })

  it("GET /api/citizen/me avec le jeton", async () => {
    const fetch = vi.fn().mockResolvedValue(json(profile))
    vi.stubGlobal("fetch", fetch)
    await expect(gateway.getMyProfile("jwt")).resolves.toEqual(profile)
    expect(fetch).toHaveBeenCalledWith(`${API}/citizen/me`, { method: "GET", headers: { Authorization: "Bearer jwt" }, body: undefined })
  })

  it("GET /api/citizen/me : 404 pour un compte non citoyen, 401 sans session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ error: "Not found" }, 404)).mockResolvedValueOnce(json({ message: "JWT Token not found" }, 401)))
    await expect(gateway.getMyProfile("jwt")).rejects.toMatchObject({ status: 404, details: { code: CitizenErrorCode.notCitizen } })
    await expect(gateway.getMyProfile("jwt")).rejects.toMatchObject({ status: 401 })
  })

  it("POST /api/citizen/me/activate avec le jeton", async () => {
    const fetch = vi.fn().mockResolvedValue(json(profile))
    vi.stubGlobal("fetch", fetch)
    await expect(gateway.activateMyCitizenAccount("jwt")).resolves.toEqual(profile)
    expect(fetch).toHaveBeenCalledWith(`${API}/citizen/me/activate`, expect.objectContaining({ method: "POST" }))
    expect(fetch.mock.calls[0][1].headers).toMatchObject({ Authorization: "Bearer jwt" })
  })

  it("PUT /api/citizen/me avec les six champs modifiables", async () => {
    const update = { firstName: "Ada", lastName: "Lovelace", phone: null, address: "12 allée des Serres", district: "Aurore", preferredLanguage: "fr" }
    const fetch = vi.fn().mockResolvedValue(json({ ...profile, ...update, profileCompleted: true }))
    vi.stubGlobal("fetch", fetch)
    await expect(gateway.updateMyProfile("jwt", update)).resolves.toMatchObject({ firstName: "Ada", profileCompleted: true })
    expect(fetch).toHaveBeenCalledWith(`${API}/citizen/me`, {
      method: "PUT",
      headers: { Authorization: "Bearer jwt", "Content-Type": "application/json" },
      body: JSON.stringify(update)
    })
  })

  it("PUT /api/citizen/me : 422 rattaché au champ refusé", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ path: "district", message: "This value is too long." }, 422)))
    const update = { firstName: null, lastName: null, phone: null, address: null, district: "x", preferredLanguage: null }
    await expect(gateway.updateMyProfile("jwt", update))
      .rejects.toMatchObject({ status: 422, message: "Quartier : cette valeur n’est pas acceptée. Vérifiez la saisie.", details: { field: "district" } })
  })

  it("panne réseau et erreur serveur restent distinctes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(new Response("", { status: 503 })))
    await expect(gateway.getMyProfile("jwt")).rejects.toMatchObject({ status: "NETWORK_ERROR" })
    await expect(gateway.getMyProfile("jwt")).rejects.toMatchObject({ status: 503, message: expect.stringMatching(/indisponible/) })
  })
})
