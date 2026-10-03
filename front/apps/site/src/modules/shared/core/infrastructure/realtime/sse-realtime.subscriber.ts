import { createRealtimeTicketProvider, openRealtimeStream, type RealtimeStream } from "@boilerplate/shared-utils/realtime"
import type { RealtimeNotification, RealtimeSubscriber } from "../../application/ports/realtime-subscriber"

type Listener = { eventTypes: readonly string[]; onEvent: (notification: RealtimeNotification) => void }

/**
 * Adaptateur SSE (`GET /api/realtime/stream`) : le flux s'ouvre au premier abonné et se ferme au dernier.
 * Le ticket est demandé avec le jeton de la session courante (`POST /api/realtime/tickets`).
 */
export class SseRealtimeSubscriber implements RealtimeSubscriber {
  private readonly listeners = new Set<Listener>()
  private stream: RealtimeStream | null = null

  constructor(
    private readonly apiBaseUrl: string,
    private readonly getToken: () => string | null,
    private readonly eventTypes: readonly string[]
  ) {}

  subscribe(eventTypes: readonly string[], onEvent: (notification: RealtimeNotification) => void): () => void {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return () => undefined
    const listener = { eventTypes, onEvent }
    this.listeners.add(listener)
    this.stream ??= openRealtimeStream({
      apiBaseUrl: this.apiBaseUrl,
      eventTypes: this.eventTypes,
      getTicket: createRealtimeTicketProvider(this.apiBaseUrl, () => {
        try {
          return this.getToken()
        } catch {
          return null
        }
      }),
      onEvent: (message) => {
        for (const current of this.listeners) {
          if (current.eventTypes.includes(message.type)) current.onEvent({ type: message.type, data: message.data })
        }
      }
    })
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) {
        this.stream?.close()
        this.stream = null
      }
    }
  }
}
