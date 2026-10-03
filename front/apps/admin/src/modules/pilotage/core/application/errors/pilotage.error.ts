export type PilotageErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "key-missing"
  | "key-rejected"
  | "upstream-unavailable"
  | "unavailable"

export class PilotageError extends Error {
  constructor(public readonly kind: PilotageErrorKind, message: string) {
    super(message)
    this.name = "PilotageError"
  }
}
