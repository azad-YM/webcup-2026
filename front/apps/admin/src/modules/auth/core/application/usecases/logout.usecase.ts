import { sessionCleared } from "@/modules/shared/core/config/session"
import type { UseCase } from "@/modules/shared/core/config/use-cases"

export const logout: UseCase<void, void> = async (
  dispatch,
  _getState,
  dependencies
) => {
  dependencies.authSessionGateway.clear()
  dispatch(sessionCleared())
}
