import type { UseCase } from "@/modules/shared/core/config/use-cases"

export const hasCitizenWorkspace: UseCase<void, boolean> = async (_dispatch, _getState, dependencies) =>
  dependencies.citizenWorkspaceProvider.isAvailable()
