import type { UseCase } from "@/modules/shared/core/config/use-cases"
import { RequestsError } from "../errors/requests.error"
import {
  MESSAGE_MAX,
  statusChangeError,
  type GroupStatusChange,
  type GroupStatusResult,
  type PriorityChange,
  type RequestMessage,
  type RequestQueue,
  type RequestQueueFilter,
  type ServiceRequest,
  type SimilarRequests,
  type StatusChange,
} from "../../domain/service-request"

export const listRequestQueue: UseCase<RequestQueueFilter, RequestQueue> = async (_dispatch, _getState, dependencies, filter) =>
  dependencies.requestQueueGateway.listQueue(filter)

export const changeRequestStatus: UseCase<StatusChange, ServiceRequest> = async (_dispatch, _getState, dependencies, change) => {
  const error = statusChangeError(change.status, change.comment ?? "")
  if (error) throw new RequestsError("invalid", error)
  return dependencies.requestQueueGateway.changeStatus({ ...change, comment: change.comment?.trim() || null })
}

export const setRequestPriority: UseCase<PriorityChange, ServiceRequest> = async (_dispatch, _getState, dependencies, change) =>
  dependencies.requestQueueGateway.setPriority({ ...change, reason: change.reason?.trim() || null })

export const markEmergencyHandled: UseCase<string, ServiceRequest> = async (_dispatch, _getState, dependencies, requestId) =>
  dependencies.requestQueueGateway.markEmergencyHandled(requestId)

export const findSimilarRequests: UseCase<string, SimilarRequests> = async (_dispatch, _getState, dependencies, requestId) =>
  dependencies.requestQueueGateway.findSimilar(requestId)

export const linkRequests: UseCase<{ requestId: string; otherIds: string[] }, { groupId: string; references: string[] }> = async (_dispatch, _getState, dependencies, { requestId, otherIds }) => {
  if (otherIds.length === 0) throw new RequestsError("invalid", "Cochez au moins une demande à lier.")
  return dependencies.requestQueueGateway.linkRequests(requestId, otherIds)
}

export const unlinkRequest: UseCase<string, { groupId: string | null; references: string[] }> = async (_dispatch, _getState, dependencies, requestId) =>
  dependencies.requestQueueGateway.unlinkRequest(requestId)

export const changeGroupStatus: UseCase<GroupStatusChange, GroupStatusResult> = async (_dispatch, _getState, dependencies, change) => {
  const error = statusChangeError(change.status, change.comment ?? "")
  if (error) throw new RequestsError("invalid", error)
  return dependencies.requestQueueGateway.changeGroupStatus({ ...change, comment: change.comment?.trim() || null })
}

export const listRequestMessages: UseCase<string, RequestMessage[]> = async (_dispatch, _getState, dependencies, requestId) =>
  dependencies.requestQueueGateway.listMessages(requestId)

export const replyToRequest: UseCase<{ requestId: string; body: string }, RequestMessage> = async (_dispatch, _getState, dependencies, { requestId, body }) => {
  const text = body.trim()
  if (!text) throw new RequestsError("invalid", "Écrivez votre réponse avant de l’envoyer.")
  if (text.length > MESSAGE_MAX) throw new RequestsError("invalid", `La réponse ne doit pas dépasser ${MESSAGE_MAX} caractères.`)
  return dependencies.requestQueueGateway.reply(requestId, text)
}
