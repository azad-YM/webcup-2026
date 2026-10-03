import type { RequestDraft, ServiceRequest } from "../../../domain/service-request"

/** Contrat HTTP des demandes du citoyen connecté (Citizen, lot L2). */
export interface ServiceRequestGateway {
  listMine(token: string): Promise<ServiceRequest[]>
  getMine(token: string, reference: string): Promise<ServiceRequest>
  submit(token: string, draft: RequestDraft): Promise<ServiceRequest>
}
