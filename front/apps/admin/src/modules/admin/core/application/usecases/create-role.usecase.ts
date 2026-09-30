import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { CreateRolePayload } from "../dto/create-role.dto"

export const createRole: UseCase<CreateRolePayload, void> = async (_dispatch, _getState, dependencies, payload) =>
  dependencies.roleGateway.create(payload)
