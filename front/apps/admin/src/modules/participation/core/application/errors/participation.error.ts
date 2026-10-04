export type ParticipationErrorKind = "unauthenticated" | "forbidden" | "invalid" | "not-found" | "unavailable"

export class ParticipationError extends Error {
  constructor(public readonly kind: ParticipationErrorKind, message: string) {
    super(message)
    this.name = "ParticipationError"
  }
}
