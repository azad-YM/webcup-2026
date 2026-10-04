export type RequestsErrorKind = "unauthenticated" | "forbidden" | "conflict" | "invalid" | "unavailable"

export class RequestsError extends Error {
  constructor(public readonly kind: RequestsErrorKind, message: string) {
    super(message)
    this.name = "RequestsError"
  }
}
