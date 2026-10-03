export interface SecuritySessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
