import type { UseCase } from "@/modules/shared/core/config/use-cases"
import { RequestsError } from "../errors/requests.error"
import { statusChangeError, type RequestQueue, type RequestQueueFilter, type ServiceRequest, type StatusChange } from "../../domain/service-request"

export const listRequestQueue: UseCase<RequestQueueFilter, RequestQueue> = async (_dispatch, _getState, dependencies, filter) =>
  dependencies.requestQueueGateway.listQueue(filter)

export const changeRequestStatus: UseCase<StatusChange, ServiceRequest> = async (_dispatch, _getState, dependencies, change) => {
  const error = statusChangeError(change.status, change.comment ?? "")
  if (error) throw new RequestsError("invalid", error)
  return dependencies.requestQueueGateway.changeStatus({ ...change, comment: change.comment?.trim() || null })
}
