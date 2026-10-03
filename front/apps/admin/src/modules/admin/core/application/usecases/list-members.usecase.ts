import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { AdminMember } from "../../domain/member"

export const listMembers: UseCase<void, AdminMember[]> = async (_dispatch, _getState, dependencies) =>
  dependencies.memberGateway.list()
