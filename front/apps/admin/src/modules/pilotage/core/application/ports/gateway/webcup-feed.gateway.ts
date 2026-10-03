import type { RequestTracking, TrackingInput, WebcupFeed } from "../../../domain/webcup-feed"

export interface WebcupFeedGateway {
  fetchFeed(): Promise<WebcupFeed>
  updateTracking(requestCode: string, input: TrackingInput): Promise<RequestTracking>
}
