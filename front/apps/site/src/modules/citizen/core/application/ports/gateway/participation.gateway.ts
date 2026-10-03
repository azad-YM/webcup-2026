import type { Concern, ConcernDraft, PublicRequest, SupportChange } from "../../../domain/participation"

/** Contrat HTTP de la participation du citoyen connecté (Citizen, lot L14). */
export interface ParticipationGateway {
  listPublicRequests(token: string): Promise<PublicRequest[]>
  support(token: string, change: SupportChange): Promise<PublicRequest>
  listConcerns(token: string): Promise<Concern[]>
  raiseConcern(token: string, draft: ConcernDraft): Promise<Concern>
}
