import type { UseCase } from "@/modules/shared/core/config/use-cases"
import { sessionCleared } from "@/modules/shared/core/config/session"

export const startPortalLogin: UseCase<void, string> = async (_dispatch, _getState, dependencies) => dependencies.portalLoginGateway.start()
export const completePortalLogin: UseCase<{ code: string; state: string }, void> = async (dispatch, _getState, dependencies, payload) => {
  await dependencies.portalLoginGateway.complete(payload.code, payload.state)
  dispatch(sessionCleared())
}
