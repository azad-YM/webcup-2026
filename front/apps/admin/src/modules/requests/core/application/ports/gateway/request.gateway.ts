import type { RequestFilter, RequestList, ServiceRequest, StatusChange } from "../../../domain/service-request"
export interface RequestGateway {
 list(filter: RequestFilter): Promise<RequestList>
 change(change: StatusChange): Promise<ServiceRequest>
 authorize(topic: string, socketId?: string): Promise<{token?: string; auth?: string}>
}
