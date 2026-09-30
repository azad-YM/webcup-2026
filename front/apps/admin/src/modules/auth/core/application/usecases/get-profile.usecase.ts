import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { AuthProfile } from "../dto/auth.dto"

export const getProfile: UseCase<void, AuthProfile | null> = async (
  _dispatch,
  _getState,
  dependencies
) => {
  return dependencies.authGateway.getProfile()
}
