/** Demandes citoyennes vues par les agents : contrat de Citizen (`api/src/Citizen/doc/README.md`). */
export type RequestType = "contact" | "report"
export type RequestStatus = "submitted" | "acknowledged" | "in_progress" | "resolved" | "rejected"

export type RequestStep = { status: RequestStatus; at: string; comment: string | null }

export type ServiceRequest = {
  id: string
  reference: string
  type: RequestType
  serviceId: string | null
  subject: string
  description: string
  location: string | null
  status: RequestStatus
  steps: RequestStep[]
  allowedTransitions: RequestStatus[]
  createdAt: string
  updatedAt: string
}

export type RequestQueue = {
  items: ServiceRequest[]
  total: number
  /** Demandes au statut `submitted` : en attente de prise en charge (D17). */
  pendingCount: number
  page: number
  pageSize: number
  canProcess: boolean
}

export type RequestQueueFilter = { status: RequestStatus | null; page: number }

export type StatusChange = {
  requestId: string
  status: RequestStatus
  expectedStatus: RequestStatus
  comment: string | null
}

export const REQUEST_STATUSES: RequestStatus[] = ["submitted", "acknowledged", "in_progress", "resolved", "rejected"]

export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "En attente",
  acknowledged: "Prise en charge",
  in_progress: "En cours",
  resolved: "Résolue",
  rejected: "Rejetée",
}

/** Libellé de l'action qui mène à chaque statut. */
export const TRANSITION_LABELS: Record<RequestStatus, string> = {
  submitted: "Remettre en attente",
  acknowledged: "Prendre en charge",
  in_progress: "Démarrer le traitement",
  resolved: "Marquer comme résolue",
  rejected: "Rejeter",
}

export const TYPE_LABELS: Record<RequestType, string> = {
  contact: "Message",
  report: "Signalement",
}

export const COMMENT_MAX = 2000

/** Même règle que l'API : un rejet exige un motif, communiqué au citoyen. */
export function statusChangeError(status: RequestStatus | null, comment: string): string | null {
  if (!status) return "Choisissez la nouvelle étape."
  if (status === "rejected" && !comment.trim()) return "Indiquez le motif du rejet : il sera visible par le citoyen."
  if (comment.trim().length > COMMENT_MAX) return `Le commentaire ne doit pas dépasser ${COMMENT_MAX} caractères.`
  return null
}
