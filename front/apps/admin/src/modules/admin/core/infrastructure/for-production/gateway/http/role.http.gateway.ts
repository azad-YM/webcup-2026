import type { CreateRolePayload } from "../../../../application/dto/create-role.dto"
import type { RoleGateway } from "../../../../application/ports/gateway/role.gateway"
import type { AdminRole } from "../../../../domain/member"
import { AccessManagementHttpClient } from "./access-management.http-client"

export class RoleHttpGateway extends AccessManagementHttpClient implements RoleGateway {
  list(): Promise<AdminRole[]> {
    return this.authorized(() => this.getAuth<AdminRole[]>("/administration/roles"))
  }

  async create(payload: CreateRolePayload): Promise<void> {
    await this.authorized(() => this.postAuth<null>("/administration/roles", payload))
  }
}
