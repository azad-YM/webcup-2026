import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { AdminRole } from "../../domain/member"

export const listRoles: UseCase<void, AdminRole[]> = async (_dispatch, _getState, dependencies) =>
  dependencies.roleGateway.list()
