import type { AccessSpace, Permission } from "../../../domain/permission"

export interface PermissionGateway {
  list(space: AccessSpace): Promise<Permission[]>
}
