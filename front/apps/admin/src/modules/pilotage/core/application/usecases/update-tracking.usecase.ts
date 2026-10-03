import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { RequestTracking, TrackingInput } from "../../domain/webcup-feed"

export const updateTracking: UseCase<{ requestCode: string; input: TrackingInput }, RequestTracking> = async (_dispatch, _getState, dependencies, { requestCode, input }) =>
  dependencies.webcupFeedGateway.updateTracking(requestCode, {
    status: input.status,
    note: input.note.trim(),
    links: input.links.map(link => ({ label: link.label.trim(), url: link.url.trim() })).filter(link => link.label !== "" || link.url !== ""),
  })
