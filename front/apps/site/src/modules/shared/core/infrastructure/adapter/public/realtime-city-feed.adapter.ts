import { CITY_FEED_EVENTS, type CityFeedEvent, type CityFeedEventType, type CityFeedGateway } from "@/modules/public/core/application/ports/gateway/city-feed.gateway"
import type { RealtimeSubscriber } from "../../../application/ports/realtime-subscriber"

/**
 * Le socle fournit au module `public` son port `CityFeedGateway` à partir de l'unique flux temps réel
 * de l'onglet (ADR 004) : aucun second `EventSource` n'est ouvert pour les alertes et publications.
 */
export class RealtimeCityFeedAdapter implements CityFeedGateway {
  constructor(private readonly realtime: RealtimeSubscriber) {}

  subscribe(listener: (event: CityFeedEvent) => void): () => void {
    return this.realtime.subscribe(CITY_FEED_EVENTS, (notification) => {
      const data = notification.data as { id?: unknown } | null
      listener({
        type: notification.type as CityFeedEventType,
        id: data && typeof data.id === "string" ? data.id : null
      })
    })
  }

  restart(): void {
    this.realtime.restart()
  }
}
