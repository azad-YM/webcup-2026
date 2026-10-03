export type RequestStatus = "submitted" | "acknowledged" | "in_progress" | "resolved" | "rejected"
export const STATUS_LABELS: Record<RequestStatus, string> = { submitted: "Envoyée", acknowledged: "Reçue par la mairie", in_progress: "En cours de traitement", resolved: "Résolue", rejected: "Refusée" }
export type ServiceRequest = { id: string; reference: string; type: "contact" | "report"; subject: string; description: string; location: string | null; serviceId: string | null; status: RequestStatus; createdAt: string; steps: { status: RequestStatus; at: string; comment: string | null }[]; allowedStatuses: RequestStatus[] }
export type RequestList = { items: ServiceRequest[]; total: number; pendingCount: number; page: number; pageSize: number; canWrite: boolean; topic: string }
export type RequestFilter = { status?: string; page: number }
export type RequestDraft = { type: "contact" | "report"; subject: string; description: string; location: string | null; serviceId: string | null }
export type StatusChange = { requestId: string; status: RequestStatus; expectedStatus: RequestStatus; comment: string | null }
