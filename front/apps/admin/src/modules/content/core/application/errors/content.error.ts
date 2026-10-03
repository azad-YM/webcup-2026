export type ContentErrorKind = "unauthenticated" | "forbidden" | "invalid" | "not-found" | "unavailable"

export class ContentError extends Error {
  constructor(public readonly kind: ContentErrorKind, message: string) {
    super(message)
    this.name = "ContentError"
  }
}
