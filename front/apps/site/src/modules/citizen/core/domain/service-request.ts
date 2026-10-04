/** Demandes citoyennes (lot L2) : contrat de Citizen, voir `api/src/Citizen/doc/README.md`. */
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
  /** F52 : signalement visible des autres habitants. */
  isPublic?: boolean
  supportCount?: number
  /** F80 : priorité de traitement ; F79 : catégorie déduite du texte, quartier. */
  priority?: "urgent" | "high" | "normal" | "low"
  category?: RequestCategory
  district?: string | null
  /** F86 : urgence médicale signalée ; heure de prise en charge par un agent. */
  medicalEmergency?: boolean
  emergencyHandledAt?: string | null
  /** F84 : messages échangés avec la mairie. */
  messageCount?: number
}

export type RequestCategory =
  | "medical_emergency" | "safety" | "water" | "roads" | "lighting" | "cleanliness" | "noise" | "administrative" | "other"

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  medical_emergency: "Urgence médicale",
  safety: "Sécurité",
  water: "Eau, inondation",
  roads: "Voirie",
  lighting: "Éclairage",
  cleanliness: "Propreté",
  noise: "Bruit",
  administrative: "Démarches",
  other: "Autre"
}

/** F84 : message du fil avec la mairie. */
export type RequestMessage = { id: string; author: "agent" | "citizen"; body: string; createdAt: string }
export type RequestMessages = { items: RequestMessage[]; canReply: boolean }
export const MESSAGE_MAX = 3000

/** F83 : accusé de réception. */
export type RequestReceipt = {
  reference: string
  type: RequestType
  subject: string
  serviceId: string | null
  serviceName: string | null
  submittedAt: string
  fingerprint: string
  medicalEmergency: boolean
}
export type ReceiptVerification = { valid: boolean; reference: string; submittedAt: string | null }

/**
 * F86 : repérage local, à la saisie, des mots d'une urgence médicale (mêmes familles que l'API).
 * Ne bloque jamais l'envoi : sert seulement à afficher tout de suite « Appelez le 15 ou le 112 ».
 */
const MEDICAL_WORDS = [
  "urgence medicale", "malaise", "inconscient", "ne respire plus", "respire mal", "arret cardiaque", "crise cardiaque",
  "infarctus", "avc", "hemorragie", "saigne", "overdose", "convulsion", "etouffe", "douleur thoracique",
  "douleur dans la poitrine", "blesse grave", "grievement blesse", "evanoui", "suicide", "intoxication", "empoisonnement",
  "accouchement", "choc anaphylactique", "samu", "ambulance"
]

export function looksLikeMedicalEmergency(text: string): boolean {
  const normalized = ` ${text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ")} `
  return MEDICAL_WORDS.some((word) => normalized.includes(` ${word}`))
}

export type RequestDraft = {
  type: RequestType
  subject: string
  description: string
  location: string
  serviceId: string | null
  /** F52 : partager le signalement (sujet, lieu, état) avec les autres habitants. */
  isPublic?: boolean
  /** F86 : case « C'est une urgence médicale ». */
  medicalEmergency?: boolean
  /** F79 : quartier concerné (facultatif ; à défaut, celui du profil). */
  district?: string
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  contact: "Message à la mairie",
  report: "Signalement"
}

/** Libellés vus par le citoyen ; « Envoyée » = en attente de prise en charge. */
export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Envoyée",
  acknowledged: "Prise en charge",
  in_progress: "En cours de traitement",
  resolved: "Résolue",
  rejected: "Refusée"
}

export const STATUS_TONES: Record<RequestStatus, string> = {
  submitted: "bg-slate-100 text-slate-800",
  acknowledged: "bg-sky-100 text-sky-900",
  in_progress: "bg-amber-100 text-amber-900",
  resolved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-red-100 text-red-900"
}

export const LIMITS = { subject: 160, description: 5000, location: 255 } as const

export type DraftField = "subject" | "description" | "location"
export type DraftErrors = Partial<Record<DraftField, string>>

export const isRequestType = (value: string | null): value is RequestType => value === "contact" || value === "report"

/** Mêmes règles que l'API : sujet et description obligatoires, lieu obligatoire pour un signalement. */
export function validateDraft(draft: RequestDraft): DraftErrors {
  const errors: DraftErrors = {}
  const subject = draft.subject.trim()
  const description = draft.description.trim()
  const location = draft.location.trim()
  if (!subject) errors.subject = "Indiquez l’objet de votre demande."
  else if (subject.length > LIMITS.subject) errors.subject = `L’objet ne doit pas dépasser ${LIMITS.subject} caractères.`
  if (!description) errors.description = "Décrivez votre demande."
  else if (description.length > LIMITS.description) errors.description = `La description ne doit pas dépasser ${LIMITS.description} caractères.`
  if (draft.type === "report" && !location) errors.location = "Indiquez où se situe le problème."
  else if (location.length > LIMITS.location) errors.location = `Le lieu ne doit pas dépasser ${LIMITS.location} caractères.`
  return errors
}

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })
