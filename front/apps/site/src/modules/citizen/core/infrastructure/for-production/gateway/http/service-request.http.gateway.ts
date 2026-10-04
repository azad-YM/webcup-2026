import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import { apiExplanation } from "./citizen-api"
import type { ServiceRequestGateway } from "../../../../application/ports/gateway/service-request.gateway"
import type {
  ReceiptVerification,
  RequestDraft,
  RequestMessage,
  RequestMessages,
  RequestReceipt,
  ServiceRequest
} from "../../../../domain/service-request"

const NETWORK_MESSAGE = "Impossible de joindre le service. Vérifiez votre connexion puis réessayez."
const UNAVAILABLE_MESSAGE = "Le service est momentanément indisponible. Réessayez dans quelques instants."

/**
 * Adaptateur HTTP des demandes du citoyen (Citizen, lot L2) :
 * `GET /citizen/requests`, `GET /citizen/requests/{reference}`, `POST /citizen/requests`.
 */
export class ServiceRequestHttpGateway extends ApiClient implements ServiceRequestGateway {
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (!(error instanceof ApiHttpError)) throw new AppError("NETWORK_ERROR", NETWORK_MESSAGE)
      const explained = apiExplanation(error)
      if (explained) throw new AppError(error.status, explained)
      switch (error.status) {
        case 401:
          throw new AppError(401, "Votre session a expiré. Veuillez vous reconnecter.")
        case 404:
          throw new AppError(404, "Cette demande est introuvable dans votre espace.")
        case 422:
          throw new AppError(422, "Certaines informations ne sont pas acceptées. Vérifiez l’objet, la description et le lieu.")
        default:
          throw new AppError(error.status, UNAVAILABLE_MESSAGE)
      }
    }
  }

  async listMine(token: string): Promise<ServiceRequest[]> {
    const body = await this.execute(() => this.get<{ items: ServiceRequest[] }>("/citizen/requests", ApiClient.authHeaders(token)))
    return body.items
  }

  getMine(token: string, reference: string): Promise<ServiceRequest> {
    return this.execute(() => this.get<ServiceRequest>(`/citizen/requests/${encodeURIComponent(reference)}`, ApiClient.authHeaders(token)))
  }

  submit(token: string, draft: RequestDraft): Promise<ServiceRequest> {
    return this.execute(() => this.post<ServiceRequest>("/citizen/requests", {
      type: draft.type,
      subject: draft.subject,
      description: draft.description,
      location: draft.location || null,
      serviceId: draft.serviceId,
      isPublic: Boolean(draft.isPublic),
      medicalEmergency: Boolean(draft.medicalEmergency),
      district: draft.district || null
    }, ApiClient.authHeaders(token)))
  }

  listMessages(token: string, reference: string): Promise<RequestMessages> {
    return this.execute(() => this.get<RequestMessages>(`/citizen/requests/${encodeURIComponent(reference)}/messages`, ApiClient.authHeaders(token)))
  }

  postMessage(token: string, reference: string, body: string): Promise<RequestMessage> {
    return this.execute(() => this.post<RequestMessage>("/citizen/requests/messages", { reference, body }, ApiClient.authHeaders(token)))
  }

  getReceipt(token: string, reference: string): Promise<RequestReceipt> {
    return this.execute(() => this.get<RequestReceipt>(`/citizen/requests/${encodeURIComponent(reference)}/receipt`, ApiClient.authHeaders(token)))
  }

  verifyReceipt(reference: string, fingerprint: string): Promise<ReceiptVerification> {
    return this.execute(() => this.post<ReceiptVerification>("/citizen/receipts/verify", { reference, fingerprint }))
  }
}
