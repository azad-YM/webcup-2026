import type { WebcupFeed } from "../../../domain/webcup-feed"

export interface WebcupFeedGateway {
  fetchFeed(): Promise<WebcupFeed>
}
