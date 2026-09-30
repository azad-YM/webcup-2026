export class RandomIdProvider {
  getId(): string {
    return crypto.randomUUID()
  }
}
