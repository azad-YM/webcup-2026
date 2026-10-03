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
}

export type RequestDraft = {
  type: RequestType
  subject: string
  description: string
  location: string
  serviceId: string | null
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
