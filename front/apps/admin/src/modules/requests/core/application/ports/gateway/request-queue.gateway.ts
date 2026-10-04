import type {
  GroupStatusChange,
  GroupStatusResult,
  PriorityChange,
  RequestMessage,
  RequestQueue,
  RequestQueueFilter,
  ServiceRequest,
  SimilarRequests,
  StatusChange,
} from "../../../domain/service-request"

/** Agents' queue of citizen requests (Citizen, lots L2 and L23). */
export interface RequestQueueGateway {
  listQueue(filter: RequestQueueFilter): Promise<RequestQueue>
  changeStatus(change: StatusChange): Promise<ServiceRequest>
  /** F80 */
  setPriority(change: PriorityChange): Promise<ServiceRequest>
  /** F86 */
  markEmergencyHandled(requestId: string): Promise<ServiceRequest>
  /** F75 */
  findSimilar(requestId: string): Promise<SimilarRequests>
  linkRequests(requestId: string, otherIds: string[]): Promise<{ groupId: string; references: string[] }>
  unlinkRequest(requestId: string): Promise<{ groupId: string | null; references: string[] }>
  changeGroupStatus(change: GroupStatusChange): Promise<GroupStatusResult>
  /** F84 */
  listMessages(requestId: string): Promise<RequestMessage[]>
  reply(requestId: string, body: string): Promise<RequestMessage>
}
