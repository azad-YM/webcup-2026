/** Participation (lot L14 : F51, F52) : contrat de Citizen, voir `api/src/Citizen/doc/participation.md`. */
import type { RequestCategory, RequestStatus } from "./service-request"

export type PublicRequest = {
  id: string
  reference: string
  subject: string
  location: string | null
  status: RequestStatus
  createdAt: string
  supportCount: number
  supportedByMe: boolean
  mine: boolean
  /** F79 : filtres par sujet et quartier. */
  serviceId?: string | null
  category?: RequestCategory
  district?: string | null
}

export type SupportChange = { requestId: string; support: boolean }

export type ConcernTopic = "data" | "service" | "security" | "other"
export type ConcernStatus = "received" | "in_review" | "answered"

export type Concern = {
  id: string
  reference: string
  topic: ConcernTopic
  subject: string
  message: string
  status: ConcernStatus
  response: string | null
  trail: { status: ConcernStatus; at: string; comment: string | null }[]
  createdAt: string
  updatedAt: string
}

export type ConcernDraft = { topic: ConcernTopic; subject: string; message: string }

export const CONCERN_TOPIC_LABELS: Record<ConcernTopic, string> = {
  data: "Mes données personnelles",
  service: "Un service de la ville",
  security: "Sécurité de mon compte",
  other: "Autre sujet"
}

export const CONCERN_STATUS_LABELS: Record<ConcernStatus, string> = {
  received: "Reçue (accusé de réception)",
  in_review: "Prise en compte par un agent",
  answered: "Réponse de la mairie"
}

export const CONCERN_LIMITS = { subject: 160, message: 5000 } as const

export function validateConcern(draft: ConcernDraft): Partial<Record<"subject" | "message", string>> {
  const errors: Partial<Record<"subject" | "message", string>> = {}
  const subject = draft.subject.trim()
  const message = draft.message.trim()
  if (!subject) errors.subject = "Indiquez l’objet de votre inquiétude."
  else if (subject.length > CONCERN_LIMITS.subject) errors.subject = `L’objet ne doit pas dépasser ${CONCERN_LIMITS.subject} caractères.`
  if (!message) errors.message = "Décrivez votre inquiétude."
  else if (message.length > CONCERN_LIMITS.message) errors.message = `Le message ne doit pas dépasser ${CONCERN_LIMITS.message} caractères.`
  return errors
}
