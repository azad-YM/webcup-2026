import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { LoginPayload } from "../dto/auth.dto"
export const login: UseCase<LoginPayload, null> = async (
  dependencies,
  payload
) => {
  const { token } = await dependencies.authGateway.loginWithCredentials(payload)
  dependencies.authSessionGateway.saveToken(token)
  return null
}
