import type { CreateRolePayload } from "../../../../application/dto/create-role.dto"
import type { RoleGateway } from "../../../../application/ports/gateway/role.gateway"
import { AccessManagementHttpClient } from "./access-management.http-client"

export class RoleHttpGateway extends AccessManagementHttpClient implements RoleGateway {
  async create(payload: CreateRolePayload): Promise<void> {
    await this.authorized(() => this.postAuth<null>("/iam/roles", payload))
  }
}
