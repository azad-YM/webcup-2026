import type { AdminRole } from "../../../core/domain/member"

/** The API only assigns roles limited to the `admin` context; others would be refused with a 422. */
export const assignableRoles = (roles: AdminRole[]): AdminRole[] =>
  roles.filter(role => role.permissions.every(permission => permission.context === "admin"))
