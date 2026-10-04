export interface AuditSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
