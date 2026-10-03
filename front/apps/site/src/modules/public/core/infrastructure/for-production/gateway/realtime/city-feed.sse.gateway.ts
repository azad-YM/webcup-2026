import { createRealtimeTicketProvider, openRealtimeStream, type RealtimeStream } from "@boilerplate/shared-utils/realtime"
import type { CityFeedEvent, CityFeedEventType, CityFeedGateway } from "../../../../application/ports/gateway/city-feed.gateway"
import type { PublicSessionProvider } from "../../../../application/ports/provider/public-session.provider"

const EVENT_TYPES: readonly CityFeedEventType[] = ["alert.published", "alert.withdrawn", "publication.published", "publication.important"]

/**
 * Flux SSE `GET /api/realtime/stream` (ADR 004), partagé par tous les écrans du module.
 * Sans session : topics publics (`public.alerts`, `public.publications`). Avec une session citoyenne,
 * le ticket ouvre aussi les topics que le serveur accorde (quartier, alertes sanitaires) :
 * le client ne choisit jamais ses topics. Ouvert au premier abonné, fermé après le dernier.
 */
export class SseCityFeedGateway implements CityFeedGateway {
  private readonly listeners = new Set<(event: CityFeedEvent) => void>()
  private stream: RealtimeStream | null = null
  private readonly getTicket: () => Promise<string | null>

  constructor(private readonly apiBaseUrl: string, session: PublicSessionProvider) {
    this.getTicket = createRealtimeTicketProvider(apiBaseUrl, () => session.getToken())
  }

  subscribe(listener: (event: CityFeedEvent) => void) {
    this.listeners.add(listener)
    this.open()
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.close()
    }
  }

  restart() {
    if (!this.stream) return
    this.close()
    this.open()
  }

  private open() {
    if (this.stream || typeof window === "undefined" || typeof EventSource === "undefined") return
    this.stream = openRealtimeStream({
      apiBaseUrl: this.apiBaseUrl,
      eventTypes: EVENT_TYPES,
      getTicket: this.getTicket,
      onEvent: (message) => {
        const data = message.data as { id?: unknown } | null
        const event: CityFeedEvent = {
          type: message.type as CityFeedEventType,
          id: data && typeof data.id === "string" ? data.id : null
        }
        for (const listener of [...this.listeners]) listener(event)
      }
    })
  }

  private close() {
    this.stream?.close()
    this.stream = null
  }
}
