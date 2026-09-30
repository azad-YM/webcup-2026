import {
  AuthError,
  type UseCase
} from "@/modules/shared/core/lib/use-cases.decorator"
import type { AuthSpace } from "../dto/auth.dto"
export const listSpaces: UseCase<void, AuthSpace[]> = async (dependencies) => {
  const token = dependencies.authSessionGateway.getToken()
  if (!token) throw new AuthError(401, "Veuillez vous connecter.")
  return dependencies.authGateway.listSpaces(token)
}
