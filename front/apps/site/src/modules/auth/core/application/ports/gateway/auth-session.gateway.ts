export interface AuthSessionGateway {
  getToken(): string | null
  saveToken(token: string): void
  clear(): void
}
