import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { ServiceRequestGateway } from "../../../../application/ports/gateway/service-request.gateway"
import type { RequestDraft, RequestFilter, RequestList, ServiceRequest } from "../../../../domain/service-request"
export class ServiceRequestHttpGateway extends ApiClient implements ServiceRequestGateway {
 private async execute<T>(run: () => Promise<T>): Promise<T> {
  try { return await run() } catch (error) {
   const status = error instanceof ApiHttpError ? error.status : "NETWORK_ERROR"
   throw new AppError(status, status === 401 ? "Votre session a expiré. Reconnectez-vous." : status === 422 ? "Vérifiez les champs. Un signalement doit préciser un lieu." : status === 403 ? "Vous n’avez pas accès à ces demandes." : "Impossible de charger ou d’enregistrer la demande. Réessayez.")
  }
 }
 list(token: string, filter: RequestFilter): Promise<RequestList> { const params = new URLSearchParams({page: String(filter.page)}); if (filter.status) params.set("status", filter.status); return this.execute(() => this.get(`/citizen/requests?${params}`, ApiClient.authHeaders(token))) }
 submit(token: string, draft: RequestDraft): Promise<ServiceRequest> { return this.execute(() => this.post("/citizen/requests", draft, ApiClient.authHeaders(token))) }
 authorize(token: string, topic: string, socketId?: string): Promise<{token?: string; auth?: string}> { return this.execute(() => this.post("/citizen/requests/subscription", {topic, socketId}, ApiClient.authHeaders(token))) }
}
