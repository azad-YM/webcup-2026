export type AccessSpace = "admin"

export type Permission = {
  context: string
  resource: string
  action: string
}

export const permissionKey = (permission: Permission): string =>
  JSON.stringify([permission.context, permission.resource, permission.action])
