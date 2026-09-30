import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { AccessSpace, Permission } from "../../domain/permission"

export const listPermissions: UseCase<AccessSpace, Permission[]> = async (_dispatch, _getState, dependencies, space) =>
  dependencies.permissionGateway.list(space)
