/** Session de l’agent, fournie par le module auth. */
export interface ContentSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
