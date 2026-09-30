import type { CreateRolePayload } from "../../dto/create-role.dto"

export interface RoleGateway {
  create(payload: CreateRolePayload): Promise<void>
}
