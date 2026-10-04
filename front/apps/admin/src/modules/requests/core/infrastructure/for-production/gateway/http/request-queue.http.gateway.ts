import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { RequestsError } from "../../../../application/errors/requests.error"
import type { RequestQueueGateway } from "../../../../application/ports/gateway/request-queue.gateway"
import type { RequestSessionProvider } from "../../../../application/ports/provider/request-session.provider"
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
} from "../../../../domain/service-request"

/** `GET /citizen/agent/requests?status=&page=` and `POST /citizen/agent/requests/status`. */
export class RequestQueueHttpGateway extends ApiClient implements RequestQueueGateway {
  constructor(baseUrl: string, private readonly session: RequestSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  async listQueue(filter: RequestQueueFilter): Promise<RequestQueue> {
    const params = new URLSearchParams({ page: String(filter.page) })
    if (filter.status) params.set("status", filter.status)
    if (filter.reveal) params.set("reveal", "1")
    if (filter.priority) params.set("priority", filter.priority)
    try {
      return await this.getAuth<RequestQueue>(`/citizen/agent/requests?${params}`)
    } catch (error) {
      throw this.translate(error)
    }
  }

  async changeStatus(change: StatusChange): Promise<ServiceRequest> {
    try {
      return await this.postAuth<ServiceRequest>("/citizen/agent/requests/status", change)
    } catch (error) {
      throw this.translate(error)
    }
  }

  setPriority(change: PriorityChange): Promise<ServiceRequest> {
    return this.call(() => this.postAuth<ServiceRequest>("/citizen/agent/requests/priority", change))
  }

  markEmergencyHandled(requestId: string): Promise<ServiceRequest> {
    return this.call(() => this.postAuth<ServiceRequest>("/citizen/agent/requests/emergency-handled", { requestId }))
  }

  findSimilar(requestId: string): Promise<SimilarRequests> {
    return this.call(() => this.getAuth<SimilarRequests>(`/citizen/agent/requests/${encodeURIComponent(requestId)}/similar`))
  }

  linkRequests(requestId: string, otherIds: string[]): Promise<{ groupId: string; references: string[] }> {
    return this.call(() => this.postAuth<{ groupId: string; references: string[] }>("/citizen/agent/requests/link", { requestId, otherIds }))
  }

  unlinkRequest(requestId: string): Promise<{ groupId: string | null; references: string[] }> {
    return this.call(() => this.postAuth<{ groupId: string | null; references: string[] }>("/citizen/agent/requests/unlink", { requestId }))
  }

  changeGroupStatus(change: GroupStatusChange): Promise<GroupStatusResult> {
    return this.call(() => this.postAuth<GroupStatusResult>("/citizen/agent/requests/group-status", change))
  }

  async listMessages(requestId: string): Promise<RequestMessage[]> {
    const body = await this.call(() => this.getAuth<{ items: RequestMessage[] }>(`/citizen/agent/requests/${encodeURIComponent(requestId)}/messages`))
    return body.items
  }

  reply(requestId: string, body: string): Promise<RequestMessage> {
    return this.call(() => this.postAuth<RequestMessage>("/citizen/agent/requests/messages", { requestId, body }))
  }

  private async call<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      throw this.translate(error)
    }
  }

  private translate(error: unknown): RequestsError {
    if (error instanceof RequestsError) return error
    if (error instanceof ApiHttpError) {
      if (error.status === 401) {
        this.session.invalidate()
        return new RequestsError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
      }
      if (error.status === 403) {
        return new RequestsError("forbidden", "Votre compte n’a pas accès aux demandes citoyennes. Demandez à un administrateur le rôle « Agent municipal » (permissions admin.request.read et admin.request.write).")
      }
      if (error.status === 404) return new RequestsError("conflict", "Cette demande n’existe plus. La liste a été actualisée.")
      if (error.status === 409) return new RequestsError("conflict", "La demande a changé entre-temps (traitée par un autre agent ?). La liste a été actualisée : vérifiez son état avant de recommencer.")
      if (error.status === 422 || error.status === 400) return new RequestsError("invalid", "Ce changement n’est pas accepté. Vérifiez les informations saisies (un rejet exige un motif ; une urgence médicale reste urgente tant qu’elle n’est pas prise en charge).")
    }
    return new RequestsError("unavailable", "Le service est indisponible. Réessayez dans quelques instants.")
  }
}
