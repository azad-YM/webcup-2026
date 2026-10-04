import { createRealtimeTicketProvider, openRealtimeStream, type RealtimeStream } from "@boilerplate/shared-utils/realtime"
import type { RealtimeNotification, RealtimeSubscriber } from "../../application/ports/realtime-subscriber"
import { setRealtimeLive } from "../../lib/realtime-health"

type Listener = { eventTypes: readonly string[]; onEvent: (notification: RealtimeNotification) => void }

/**
 * Adaptateur SSE (`GET /api/realtime/stream`) : **un seul flux par onglet** pour tout le site. Il écoute l'union
 * des types d'événements des modules (fournie par la composition), s'ouvre au premier abonné et se ferme au
 * dernier. Le ticket est demandé avec le jeton de la session courante (`POST /api/realtime/tickets`) ; sans
 * session, seuls les topics publics sont servis. `restart()` rouvre le flux après un changement de session.
 * L17 (F62) : `isPaused` (mode léger) empêche l'ouverture ; les écrans gardent leur rafraîchissement de secours espacé.
 */
export class SseRealtimeSubscriber implements RealtimeSubscriber {
  private readonly listeners = new Set<Listener>()
  private stream: RealtimeStream | null = null
  private readonly getTicket: () => Promise<string | null>

  constructor(
    private readonly apiBaseUrl: string,
    getToken: () => string | null,
    private readonly eventTypes: readonly string[],
    private readonly isPaused: () => boolean = () => false
  ) {
    this.getTicket = createRealtimeTicketProvider(apiBaseUrl, () => {
      try {
        return getToken()
      } catch {
        return null
      }
    })
  }

  subscribe(eventTypes: readonly string[], onEvent: (notification: RealtimeNotification) => void): () => void {
    const listener = { eventTypes, onEvent }
    this.listeners.add(listener)
    this.open()
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.close()
    }
  }

  restart(): void {
    this.close()
    if (this.listeners.size > 0) this.open()
  }

  private open() {
    if (this.stream || typeof window === "undefined" || typeof EventSource === "undefined" || this.isPaused()) return
    this.stream = openRealtimeStream({
      apiBaseUrl: this.apiBaseUrl,
      eventTypes: this.eventTypes,
      getTicket: this.getTicket,
      onStatus: setRealtimeLive,
      onEvent: (message) => {
        for (const current of [...this.listeners]) {
          if (current.eventTypes.includes(message.type)) current.onEvent({ type: message.type, data: message.data })
        }
      }
    })
  }

  private close() {
    this.stream?.close()
    this.stream = null
  }
}
