import type { Permission } from "../../domain/permission"

export type CreateRolePayload = {
  name: string
  permissions: Permission[]
}
