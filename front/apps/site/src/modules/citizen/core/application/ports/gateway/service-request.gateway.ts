import type { RequestDraft, RequestFilter, RequestList, ServiceRequest } from "../../../domain/service-request"
export interface ServiceRequestGateway {
 list(token: string, filter: RequestFilter): Promise<RequestList>
 submit(token: string, draft: RequestDraft): Promise<ServiceRequest>
 authorize(token: string, topic: string, socketId?: string): Promise<{token?: string; auth?: string}>
}
