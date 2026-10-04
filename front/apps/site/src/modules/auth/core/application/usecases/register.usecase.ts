import { AppError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import { RegistrationErrorCode, type RegistrationPayload } from "../dto/auth.dto"

/**
 * Étape 1 de l’inscription : création du compte citoyen, puis connexion
 * avec les mêmes identifiants (`POST /api/login_check`).
 */
export const register: UseCase<RegistrationPayload, null> = async (dependencies, payload) => {
  const credentials = { email: payload.email.trim(), password: payload.password }
  await dependencies.accountRegistrationGateway.register(credentials)
  try {
    const response = await dependencies.authGateway.loginWithCredentials({ ...credentials, deviceId: dependencies.deviceIdentityGateway.deviceId() })
    // Un nouveau compte n'a pas encore activé la vérification supplémentaire (F53) : la session est ouverte.
    if (!("token" in response)) throw new AppError("CLIENT_ERROR", "verification")
    dependencies.authSessionGateway.saveToken(response.token)
  } catch (error) {
    throw new AppError(
      error instanceof AppError ? error.status : "CLIENT_ERROR",
      "Votre compte a bien été créé, mais la connexion automatique n’a pas abouti. Connectez-vous avec votre adresse e-mail et votre mot de passe.",
      { code: RegistrationErrorCode.createdButNotSignedIn }
    )
  }
  return null
}
