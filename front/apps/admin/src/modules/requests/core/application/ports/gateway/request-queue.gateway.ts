import type { RequestQueue, RequestQueueFilter, ServiceRequest, StatusChange } from "../../../domain/service-request"

/** Agents' queue of citizen requests (Citizen, lot L2). */
export interface RequestQueueGateway {
  listQueue(filter: RequestQueueFilter): Promise<RequestQueue>
  changeStatus(change: StatusChange): Promise<ServiceRequest>
}
