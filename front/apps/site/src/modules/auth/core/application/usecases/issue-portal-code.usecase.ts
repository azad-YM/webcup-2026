import { AuthError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"

export const issuePortalCode: UseCase<string, { code: string }> = async (dependencies, challenge) => {
  const token = dependencies.authSessionGateway.getToken()
  if (!token) throw new AuthError(401, "Veuillez vous connecter.")
  return dependencies.authGateway.issuePortalCode(token, challenge)
}
