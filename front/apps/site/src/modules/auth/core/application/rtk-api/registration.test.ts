import { describe, expect, it } from "vitest"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import { createTestContext } from "@/test-support/test-dependencies"
import { RegistrationErrorCode } from "../dto/auth.dto"
import { authApi } from "./auth"

const payload = { email: "ada@nova-terra.fr", password: "motdepasse" }

function setup() {
  const context = createTestContext()
  // Le double d’IAM connaît le compte dès que Citizen l’a créé.
  const register = context.citizenGateway.register.bind(context.citizenGateway)
  context.citizenGateway.register = async (input) => {
    const result = await register(input)
    context.authGateway.accounts.set(input.email, input.password)
    return result
  }
  return context
}

describe("Inscription — étape 1 (compte, puis connexion automatique)", () => {
  it("crée le compte citoyen puis ouvre la session avec les mêmes identifiants", async () => {
    const { store, citizenGateway, authGateway, authSessionGateway } = setup()
    await store.dispatch(authApi.endpoints.registerAccount.initiate({ ...payload, email: "  ada@nova-terra.fr " })).unwrap()
    expect(citizenGateway.registrations).toEqual([payload])
    expect(authGateway.logins).toEqual([payload])
    expect(authSessionGateway.getToken()).toBe("token:ada@nova-terra.fr")
  })

  it("refuse un e-mail déjà utilisé sans tenter de connexion", async () => {
    const { store, citizenGateway, authGateway, authSessionGateway } = setup()
    citizenGateway.seed(payload.email)
    await expect(store.dispatch(authApi.endpoints.registerAccount.initiate(payload)).unwrap())
      .rejects.toMatchObject({ status: 409, code: RegistrationErrorCode.accountAlreadyExists, data: "Un compte existe déjà avec cet e-mail." })
    expect(authGateway.logins).toHaveLength(0)
    expect(authSessionGateway.getToken()).toBeNull()
  })

  it("traduit un refus de saisie (422) vers le contrat d’auth", async () => {
    const { store, citizenGateway } = setup()
    citizenGateway.failNextWith = new AppError(422, "Mot de passe refusé.", { code: "INVALID_PAYLOAD", field: "password" })
    await expect(store.dispatch(authApi.endpoints.registerAccount.initiate(payload)).unwrap())
      .rejects.toMatchObject({ status: 422, code: RegistrationErrorCode.invalidRegistration, field: "password" })
  })

  it("signale une panne réseau sans ouvrir de session", async () => {
    const { store, citizenGateway, authSessionGateway } = setup()
    citizenGateway.failNextWith = new AppError("NETWORK_ERROR", "Impossible de joindre le service.")
    await expect(store.dispatch(authApi.endpoints.registerAccount.initiate(payload)).unwrap())
      .rejects.toMatchObject({ status: "NETWORK_ERROR" })
    expect(authSessionGateway.getToken()).toBeNull()
  })

  it("indique que le compte existe si la connexion automatique échoue", async () => {
    const { store, authGateway, authSessionGateway } = setup()
    authGateway.failNextLoginWith = new AppError("NETWORK_ERROR", "Impossible de joindre le service.")
    await expect(store.dispatch(authApi.endpoints.registerAccount.initiate(payload)).unwrap())
      .rejects.toMatchObject({ code: RegistrationErrorCode.createdButNotSignedIn })
    expect(authSessionGateway.getToken()).toBeNull()
  })
})
