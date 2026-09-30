export interface AccessSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
