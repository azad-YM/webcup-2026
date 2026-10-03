import { ApiClient } from "@boilerplate/shared-utils/api-client"
import type { ParticipationGateway } from "../../../../application/ports/gateway/participation.gateway"
import type { Concern, ConcernDraft, PublicRequest, SupportChange } from "../../../../domain/participation"
import { callCitizenApi } from "./citizen-api"

/** `GET /citizen/public-requests`, `POST /citizen/public-requests/support`, `GET|POST /citizen/concerns`. */
export class ParticipationHttpGateway extends ApiClient implements ParticipationGateway {
  async listPublicRequests(token: string): Promise<PublicRequest[]> {
    const body = await callCitizenApi(() => this.get<{ items: PublicRequest[] }>("/citizen/public-requests", ApiClient.authHeaders(token)))
    return body.items
  }

  support(token: string, change: SupportChange): Promise<PublicRequest> {
    return callCitizenApi(() => this.post<PublicRequest>("/citizen/public-requests/support", change, ApiClient.authHeaders(token)), {
      404: "Cette demande n’est plus visible.",
      422: "Vous ne pouvez pas soutenir votre propre demande, ni une demande déjà close."
    })
  }

  async listConcerns(token: string): Promise<Concern[]> {
    const body = await callCitizenApi(() => this.get<{ items: Concern[] }>("/citizen/concerns", ApiClient.authHeaders(token)))
    return body.items
  }

  raiseConcern(token: string, draft: ConcernDraft): Promise<Concern> {
    return callCitizenApi(() => this.post<Concern>("/citizen/concerns", draft, ApiClient.authHeaders(token)), {
      422: "Certaines informations ne sont pas acceptées. Vérifiez l’objet et le message."
    })
  }
}
