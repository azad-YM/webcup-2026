import type { CityFeedEvent, CityFeedGateway } from "../../application/ports/gateway/city-feed.gateway"

/** Double : émet les événements à la demande, sans réseau. */
export class InMemoryCityFeedGateway implements CityFeedGateway {
  private readonly listeners = new Set<(event: CityFeedEvent) => void>()

  subscribe(listener: (event: CityFeedEvent) => void) {
    this.listeners.add(listener)
    return () => void this.listeners.delete(listener)
  }

  restart() {}

  emit(event: CityFeedEvent) {
    for (const listener of [...this.listeners]) listener(event)
  }
}
