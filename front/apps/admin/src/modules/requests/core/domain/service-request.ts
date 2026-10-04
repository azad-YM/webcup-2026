/** Demandes citoyennes vues par les agents : contrat de Citizen (`api/src/Citizen/doc/README.md`). */
export type RequestType = "contact" | "report"
export type RequestStatus = "submitted" | "acknowledged" | "in_progress" | "resolved" | "rejected"

export type RequestStep = { status: RequestStatus; at: string; comment: string | null }

/** F80 : priorité proposée par les règles (`auto`) ou fixée par un agent (`agent`). */
export type RequestPriority = "urgent" | "high" | "normal" | "low"
export type RequestCategory =
  | "medical_emergency" | "safety" | "water" | "roads" | "lighting" | "cleanliness" | "noise" | "administrative" | "other"

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
  /** F70 : champs retirés par l’API (lieu d’une demande de contact) pour un agent non habilité. */
  maskedFields?: string[]
  priority: RequestPriority
  priorityReason: string | null
  prioritySource: "auto" | "agent"
  category: RequestCategory
  district: string | null
  /** F86 : urgence médicale cochée par l’habitant ou détectée dans son texte. */
  medicalEmergency: boolean
  emergencyHandledAt: string | null
  /** F75 : groupe « même problème ». */
  groupId: string | null
  /** F84 : messages échangés avec l’habitant. */
  messageCount: number
}

export type PendingEmergency = { id: string; reference: string; subject: string; createdAt: string }

export type RequestQueue = {
  items: ServiceRequest[]
  total: number
  /** Demandes au statut `submitted` : en attente de prise en charge (D17). */
  pendingCount: number
  page: number
  pageSize: number
  canProcess: boolean
  /** F70 : données sensibles affichées (journalisé) et droit de les afficher. */
  sensitive?: { revealed: boolean; canReveal: boolean }
  /** F80 : demandes non closes de priorité « urgente ». */
  urgentCount: number
  /** F86 : urgences médicales pas encore prises en charge (bandeau persistant). */
  pendingEmergencies: PendingEmergency[]
}

/** `reveal` (F70) : demander l’affichage des données sensibles ; refusé côté API sans habilitation. */
export type RequestQueueFilter = { status: RequestStatus | null; page: number; reveal?: boolean; priority?: RequestPriority | null }

export type PriorityChange = { requestId: string; priority: RequestPriority; reason: string | null }

/** F75 : demande proche, ou membre du groupe déjà lié. */
export type SimilarRequest = {
  id: string
  reference: string
  type: RequestType
  subject: string
  status: RequestStatus
  priority: RequestPriority
  category: RequestCategory
  district: string | null
  createdAt: string
  groupId: string | null
  score: number | null
  reasons: string[]
}

export type SimilarRequests = {
  requestId: string
  /** `ai` : regroupement affiné par le modèle de langage ; `local` : repli par similarité de texte. */
  source: "ai" | "local"
  topic: string | null
  groupId: string | null
  group: SimilarRequest[]
  items: SimilarRequest[]
}

export type GroupStatusChange = { groupId: string; status: RequestStatus; comment: string | null }
export type GroupStatusResult = { changed: string[]; skipped: string[] }

/** F84 : message du fil agent ↔ habitant. */
export type RequestMessage = { id: string; author: "agent" | "citizen"; body: string; createdAt: string }

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
export const MESSAGE_MAX = 3000
export const PRIORITY_REASON_MAX = 255

export const PRIORITIES: RequestPriority[] = ["urgent", "high", "normal", "low"]

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  urgent: "Urgente",
  high: "Haute",
  normal: "Normale",
  low: "Basse",
}

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  medical_emergency: "Urgence médicale",
  safety: "Sécurité",
  water: "Eau, inondation",
  roads: "Voirie",
  lighting: "Éclairage",
  cleanliness: "Propreté",
  noise: "Bruit",
  administrative: "Démarches",
  other: "Autre",
}

/** F84 : réponses types, à adapter avant l’envoi. */
export const REPLY_TEMPLATES: { label: string; body: string }[] = [
  { label: "Demande bien reçue", body: "Bonjour,\n\nNous avons bien reçu votre demande et elle est en cours d’examen par le service concerné. Nous revenons vers vous dès que possible.\n\nLa mairie de Nova Terra" },
  { label: "Précision nécessaire", body: "Bonjour,\n\nPour traiter votre demande, pourriez-vous nous préciser le lieu exact (rue, numéro ou repère visible) et, si possible, depuis quand le problème existe ?\n\nLa mairie de Nova Terra" },
  { label: "Intervention programmée", body: "Bonjour,\n\nUne intervention est programmée. Nous vous tiendrons informé de son avancement dans cette demande.\n\nLa mairie de Nova Terra" },
  { label: "Problème déjà signalé", body: "Bonjour,\n\nCe problème nous a déjà été signalé par d’autres habitants : votre demande a été rattachée au même dossier et sera traitée avec lui.\n\nLa mairie de Nova Terra" },
]

/** Même règle que l'API : un rejet exige un motif, communiqué au citoyen. */
export function statusChangeError(status: RequestStatus | null, comment: string): string | null {
  if (!status) return "Choisissez la nouvelle étape."
  if (status === "rejected" && !comment.trim()) return "Indiquez le motif du rejet : il sera visible par le citoyen."
  if (comment.trim().length > COMMENT_MAX) return `Le commentaire ne doit pas dépasser ${COMMENT_MAX} caractères.`
  return null
}
