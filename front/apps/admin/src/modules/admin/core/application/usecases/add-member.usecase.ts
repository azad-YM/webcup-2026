import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { AddMemberPayload, AddMemberResult } from "../dto/add-member.dto"

export const addMember: UseCase<AddMemberPayload, AddMemberResult> = async (_dispatch, _getState, dependencies, payload) =>
  dependencies.memberGateway.add({
    name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    roleIds: [...new Set(payload.roleIds)],
  })
