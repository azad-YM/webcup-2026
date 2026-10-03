export interface AccountSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
