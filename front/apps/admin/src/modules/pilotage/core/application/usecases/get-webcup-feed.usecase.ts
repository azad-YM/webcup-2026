import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { WebcupFeed } from "../../domain/webcup-feed"

export const getWebcupFeed: UseCase<void, WebcupFeed> = async (_dispatch, _getState, dependencies) =>
  dependencies.webcupFeedGateway.fetchFeed()
