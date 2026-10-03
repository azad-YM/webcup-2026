import type { PortalLoginGateway } from "@/modules/auth/core/application/ports/gateway/portal-login.gateway"
import type { AuthGateway } from "@/modules/auth/core/application/ports/gateway/auth.gateway"
import type { AuthSessionGateway } from "@/modules/auth/core/application/ports/gateway/auth-session.gateway"
import type { PermissionGateway } from "@/modules/admin/core/application/ports/gateway/permission.gateway"
import type { RoleGateway } from "@/modules/admin/core/application/ports/gateway/role.gateway"
import type { MemberGateway } from "@/modules/admin/core/application/ports/gateway/member.gateway"

export type Dependencies = {
  portalLoginGateway: PortalLoginGateway
  authGateway: AuthGateway
  authSessionGateway: AuthSessionGateway
  permissionGateway: PermissionGateway
  roleGateway: RoleGateway
  memberGateway: MemberGateway
}
