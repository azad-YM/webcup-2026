import type { PermissionGateway } from "../../../../application/ports/gateway/permission.gateway"
import type { AccessSpace, Permission } from "../../../../domain/permission"
import { AccessManagementHttpClient } from "./access-management.http-client"

export class PermissionHttpGateway extends AccessManagementHttpClient implements PermissionGateway {
  list(space: AccessSpace): Promise<Permission[]> {
    if (space !== "admin") throw new Error("Unsupported permission space")
    return this.authorized(() => this.getAuth<Permission[]>("/iam/permissions"))
  }
}
