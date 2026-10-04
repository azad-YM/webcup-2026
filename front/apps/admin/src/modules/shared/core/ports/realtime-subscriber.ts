/**
 * Realtime subscription of the admin app (ADR 004): one SSE stream per tab, shared by the screens.
 * Topics are decided by the server from the connected account; screens only receive ids and statuses
 * and reload from the API (RTK Query invalidation).
 */
export type RealtimeNotification = { type: string; data: unknown }

export interface RealtimeSubscriber {
  /** Returns the unsubscribe function. */
  subscribe(eventTypes: readonly string[], onEvent: (notification: RealtimeNotification) => void): () => void
}
