import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { AuthSpace } from "../dto/auth.dto"

export const listSpaces: UseCase<void, AuthSpace[]> = async (
  _dispatch,
  _getState,
  dependencies
) => {
  return dependencies.authGateway.listSpaces()
}
