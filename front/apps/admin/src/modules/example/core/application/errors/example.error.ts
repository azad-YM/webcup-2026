export type ExampleErrorKind = "unauthenticated" | "forbidden" | "invalid" | "not-found" | "unavailable"

export class ExampleError extends Error {
  constructor(public readonly kind: ExampleErrorKind, message: string) {
    super(message)
    this.name = "ExampleError"
  }
}
