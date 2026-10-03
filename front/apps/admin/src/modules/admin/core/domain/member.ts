import type { Permission } from "./permission"

export type AdminRole = {
  id: string
  name: string
  permissions: Permission[]
}

export type AdminMemberRole = {
  id: string
  name: string
}

export type AdminMember = {
  id: string
  userId: string
  name: string
  roles: AdminMemberRole[]
  active: boolean
}

/** Mirrors the payload constraints of `POST /api/administration/members`; the server stays authoritative. */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_BYTES = 72

export const isInitialPasswordValid = (password: string): boolean => {
  const bytes = new TextEncoder().encode(password).length
  return password.length >= PASSWORD_MIN_LENGTH && bytes <= PASSWORD_MAX_BYTES
}
