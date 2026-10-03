import type { AdminRole } from "../../../domain/member"
import type { CreateRolePayload } from "../../dto/create-role.dto"

export interface RoleGateway {
  list(): Promise<AdminRole[]>
  create(payload: CreateRolePayload): Promise<void>
}
