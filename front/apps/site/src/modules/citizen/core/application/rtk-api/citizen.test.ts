import { describe, expect, it, vi } from "vitest"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import { createTestContext } from "@/test-support/test-dependencies"
import { toDraft } from "../../domain/citizen-profile"
import { CitizenErrorCode } from "../ports/gateway/citizen.gateway"
import { citizenApi } from "./citizen"

const email = "ada@nova-terra.fr"

function signedInCitizen() {
  const context = createTestContext()
  context.citizenGateway.seed(email)
  context.authSessionGateway.saveToken(`token:${email}`)
  return context
}

describe("Espace citoyen — profil", () => {
  it("exige une session sans appeler Citizen", async () => {
    const { store, citizenGateway } = createTestContext()
    citizenGateway.seed(email)
    await expect(store.dispatch(citizenApi.endpoints.getMyProfile.initiate(undefined, { subscribe: false })).unwrap())
      .rejects.toMatchObject({ status: 401 })
  })

  it("charge le profil du citoyen connecté", async () => {
    const { store } = signedInCitizen()
    const profile = await store.dispatch(citizenApi.endpoints.getMyProfile.initiate(undefined, { subscribe: false })).unwrap()
    expect(profile).toMatchObject({ id: "citizen-1", firstName: null, profileCompleted: false })
  })

  it("distingue un compte qui n’est pas citoyen (404)", async () => {
    const { store, authSessionGateway } = createTestContext()
    authSessionGateway.saveToken("token:agent@nova-terra.fr")
    await expect(store.dispatch(citizenApi.endpoints.getMyProfile.initiate(undefined, { subscribe: false })).unwrap())
      .rejects.toMatchObject({ status: 404, code: CitizenErrorCode.notCitizen })
  })

  it("active l’espace citoyen d’un compte existant puis recharge le profil", async () => {
    const { store, citizenGateway, authSessionGateway } = createTestContext()
    authSessionGateway.saveToken("token:agent@nova-terra.fr")
    const subscription = store.dispatch(citizenApi.endpoints.getMyProfile.initiate())
    await expect(subscription.unwrap()).rejects.toMatchObject({ status: 404 })
    await store.dispatch(citizenApi.endpoints.activateMyCitizenAccount.initiate()).unwrap()
    expect(citizenGateway.activations).toEqual(["agent@nova-terra.fr"])
    await vi.waitFor(() => expect(citizenApi.endpoints.getMyProfile.select()(store.getState()).data?.id).toBeDefined())
    subscription.unsubscribe()
  })

  it("enregistre une saisie nettoyée et met le cache à jour", async () => {
    const { store, citizenGateway } = signedInCitizen()
    const subscription = store.dispatch(citizenApi.endpoints.getMyProfile.initiate())
    await subscription.unwrap()
    const draft = { ...toDraft(null), firstName: " Ada ", lastName: "Lovelace", district: "Aurore", preferredLanguage: "fr" }
    const saved = await store.dispatch(citizenApi.endpoints.updateMyProfile.initiate(draft)).unwrap()
    expect(citizenGateway.updates).toEqual([{ firstName: "Ada", lastName: "Lovelace", phone: null, address: null, district: "Aurore", preferredLanguage: "fr" }])
    expect(saved.profileCompleted).toBe(true)
    await vi.waitFor(() => expect(citizenApi.endpoints.getMyProfile.select()(store.getState()).data?.firstName).toBe("Ada"))
    subscription.unsubscribe()
  })

  it("refuse une saisie invalide avant tout appel", async () => {
    const { store, citizenGateway } = signedInCitizen()
    await expect(store.dispatch(citizenApi.endpoints.updateMyProfile.initiate({ ...toDraft(null), phone: "pas un numéro" })).unwrap())
      .rejects.toMatchObject({ status: 422, field: "phone" })
    expect(citizenGateway.updates).toHaveLength(0)
  })

  it("conserve la session lors d’une panne réseau", async () => {
    const { store, citizenGateway, authSessionGateway } = signedInCitizen()
    citizenGateway.failNextWith = new AppError("NETWORK_ERROR", "Impossible de joindre le service.")
    await expect(store.dispatch(citizenApi.endpoints.updateMyProfile.initiate({ ...toDraft(null), firstName: "Ada" })).unwrap())
      .rejects.toMatchObject({ status: "NETWORK_ERROR" })
    expect(authSessionGateway.getToken()).toBe(`token:${email}`)
  })
})
