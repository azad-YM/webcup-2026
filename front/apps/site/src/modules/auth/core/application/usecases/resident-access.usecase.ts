import { AuthError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"

/**
 * F71 : connexion par identifiant d’habitant (`NT-XXXX-XXXX`) et code. IAM accepte l’identifiant
 * dans le champ `email` de `login_check`. Rend vrai si le code provisoire doit être remplacé.
 */
export const loginAsResident: UseCase<{ residentId: string; code: string }, { passwordChangeRequired: boolean }> = async (dependencies, payload) => {
  let token: string
  try {
    ({ token } = await dependencies.authGateway.loginWithCredentials({ email: payload.residentId.trim().toUpperCase(), password: payload.code.trim() }))
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) throw new AuthError(401, "Identifiant d’habitant ou code incorrect. Vérifiez la fiche remise par la mairie.")
    throw error
  }
  dependencies.authSessionGateway.saveToken(token)
  const status = await dependencies.residentAccessGateway.accountStatus(token)
  return { passwordChangeRequired: status.passwordChangeRequired }
}

export const getAccountAccessStatus: UseCase<void, { residentId: string | null; passwordChangeRequired: boolean }> = async (dependencies) => {
  const token = dependencies.authSessionGateway.getToken()
  if (!token) throw new AuthError(401, "Connectez-vous pour continuer.")
  return dependencies.residentAccessGateway.accountStatus(token)
}

export const changeMyCode: UseCase<{ currentPassword: string; newPassword: string }, null> = async (dependencies, payload) => {
  const token = dependencies.authSessionGateway.getToken()
  if (!token) throw new AuthError(401, "Connectez-vous pour continuer.")
  await dependencies.residentAccessGateway.changePassword(token, payload)
  return null
}
