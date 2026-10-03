/** Session of the connected agent, provided by the `auth` module (`auth/core/infrastructure/adapter/requests`). */
export interface RequestSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
