/**
 * Port owned by the example module. The auth module implements it in its own
 * infrastructure (adapter/example); the kernel injects that adapter.
 */
export interface AccessSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
