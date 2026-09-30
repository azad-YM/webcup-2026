export type AccessManagementErrorKind = "unauthenticated" | "forbidden" | "invalid" | "unavailable"

export class AccessManagementError extends Error {
  constructor(public readonly kind: AccessManagementErrorKind, message: string) {
    super(message)
    this.name = "AccessManagementError"
  }
}
