export interface PilotageSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
