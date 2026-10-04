import type {
  ReceiptVerification,
  RequestDraft,
  RequestMessage,
  RequestMessages,
  RequestReceipt,
  ServiceRequest
} from "../../../domain/service-request"

/** Contrat HTTP des demandes du citoyen connecté (Citizen, lots L2 et L23). */
export interface ServiceRequestGateway {
  listMine(token: string): Promise<ServiceRequest[]>
  getMine(token: string, reference: string): Promise<ServiceRequest>
  submit(token: string, draft: RequestDraft): Promise<ServiceRequest>
  /** F84 */
  listMessages(token: string, reference: string): Promise<RequestMessages>
  postMessage(token: string, reference: string, body: string): Promise<RequestMessage>
  /** F83 */
  getReceipt(token: string, reference: string): Promise<RequestReceipt>
  /** F83 : vérification publique (sans session). */
  verifyReceipt(reference: string, fingerprint: string): Promise<ReceiptVerification>
}
