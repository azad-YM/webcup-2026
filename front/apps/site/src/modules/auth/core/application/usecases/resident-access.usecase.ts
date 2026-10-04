import { AuthError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import { login } from "./login.usecase"

/**
 * F71 : connexion par identifiant d’habitant (`NT-XXXX-XXXX`) et code. IAM accepte l’identifiant
 * dans le champ `email` de `login_check` ; la connexion suit le même parcours que par e-mail
 * (appareil, `CompleteSignIn`). Rend vrai si le code provisoire doit être remplacé.
 */
export const loginAsResident: UseCase<{ residentId: string; code: string }, { passwordChangeRequired: boolean }> = async (dependencies, payload) => {
  let result
  try {
    result = await login(dependencies, { email: payload.residentId.trim().toUpperCase(), password: payload.code.trim() })
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) throw new AuthError(401, "Identifiant d’habitant ou code incorrect. Vérifiez la fiche remise par la mairie.")
    throw error
  }
  // Un compte sans e-mail ne peut pas recevoir de code de vérification : la seconde étape ne le concerne pas.
  if (result.status !== "signed_in") throw new AuthError(403, "Une vérification par e-mail est demandée : connectez-vous avec votre adresse e-mail.")
  const token = dependencies.authSessionGateway.getToken()
  if (!token) throw new AuthError("CLIENT_ERROR", "Le stockage du navigateur est indisponible. Autorisez-le pour vous connecter.")
  const status = await dependencies.residentAccessGateway.accountStatus(token)
  return { passwordChangeRequired: status.passwordChangeRequired }
}

export const getAccountAccessStatus: UseCase<void, { residentId: string | null; passwordChangeRequired: boolean }> = async (dependencies) => {
  const token = dependencies.authSessionGateway.getToken()
  if (!token) throw new AuthError(401, "Connectez-vous pour continuer.")
  return dependencies.residentAccessGateway.accountStatus(token)
}

/** Remplace le code provisoire (`PUT /iam/me/password`, F54) ; IAM rend une nouvelle session pour cet appareil. */
export const changeMyCode: UseCase<{ currentPassword: string; newPassword: string }, null> = async (dependencies, payload) => {
  const token = dependencies.authSessionGateway.getToken()
  if (!token) throw new AuthError(401, "Connectez-vous pour continuer.")
  const renewed = await dependencies.accountSecurityGateway.changePassword(token, payload)
  dependencies.authSessionGateway.saveToken(renewed.token)
  return null
}
