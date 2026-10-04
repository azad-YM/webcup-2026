/**
 * Participation des habitants (BC Participation, lot L19) : projets (F67), consultations et avis (F65, F66),
 * boîte à idées (F68). Les règles font autorité côté API ; ces types reprennent son contrat HTTP.
 */
export type PublicationState = "draft" | "published" | "withdrawn"
export type ProjectStatus = "study" | "in_progress" | "done"
export type ConsultationKind = "opinion" | "consultation"
export type ConsultationPhase = "upcoming" | "open" | "closed"
export type Rating = "positive" | "mixed" | "negative"
export type IdeaStatus = "received" | "in_review" | "accepted" | "rejected" | "done"

export const STATE_LABELS: Record<PublicationState, string> = { draft: "Brouillon", published: "Publié", withdrawn: "Retiré" }
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = { study: "À l’étude", in_progress: "En cours", done: "Terminé" }
export const KIND_LABELS: Record<ConsultationKind, string> = { opinion: "Avis (non officiel)", consultation: "Consultation (choix proposés)" }
export const PHASE_LABELS: Record<ConsultationPhase, string> = { upcoming: "À venir", open: "Ouverte", closed: "Close" }
export const RATING_LABELS: Record<Rating, string> = { positive: "Plutôt favorable", mixed: "Partagé", negative: "Plutôt défavorable" }
export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  received: "Reçue",
  in_review: "À l’étude",
  accepted: "Retenue",
  rejected: "Non retenue",
  done: "Réalisée",
}

export type ProjectStep = { label: string; date: string; done: boolean }

export type Project = {
  id: string | null
  title: string
  summary: string
  description: string[]
  district: string | null
  status: ProjectStatus
  steps: ProjectStep[]
  nextStep: string | null
  state: PublicationState
  publishedAt?: string | null
  updatedAt?: string
}

export type ConsultationOption = { id: string; label: string }

export type ConsultationResults = {
  total: number
  choices: (ConsultationOption & { count: number })[]
  ratings: { rating: Rating; count: number }[]
  comments: number
}

export type Consultation = {
  id: string | null
  projectId: string | null
  kind: ConsultationKind
  title: string
  question: string
  description: string[]
  options: ConsultationOption[]
  opensAt: string
  closesAt: string
  state: PublicationState
  phase?: ConsultationPhase
  contributionCount?: number
  results?: ConsultationResults | null
  outcome?: { text: string[]; publishedAt: string | null } | null
  updatedAt?: string
}

/** Corps envoyé pour enregistrer une consultation : les choix sont de simples libellés. */
export type ConsultationDraft = Omit<Consultation, "options" | "phase" | "contributionCount" | "results" | "outcome" | "updatedAt"> & { options: string[] }

export type ContributionView = {
  reference: string
  choice: string | null
  rating: Rating | null
  comment: string | null
  submittedAt: string
  updatedAt: string
}

export type IdeaTrailStep = { status: IdeaStatus; at: string; comment: string | null }

export type Idea = {
  id: string
  reference: string
  title: string
  description: string
  district: string | null
  status: IdeaStatus
  statusComment: string | null
  public: boolean
  hiddenReason: string | null
  trail: IdeaTrailStep[]
  createdAt: string
  updatedAt: string
}

export type IdeaFollowUp = { ideaId: string; status: Exclude<IdeaStatus, "received">; comment: string | null }
export type IdeaVisibility = { ideaId: string; public: boolean; reason: string | null }
export type ConsultationOutcome = { consultationId: string; outcome: string[] }

export const toLines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean)
export const fromLines = (lines: string[]) => lines.join("\n")

/** `datetime-local` (heure locale) ↔ ISO 8601. */
export const toLocalInput = (iso: string) => {
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
export const fromLocalInput = (value: string) => new Date(value).toISOString()

export const newProject = (): Project => ({
  id: null, title: "", summary: "", description: [], district: null, status: "study", steps: [], nextStep: null, state: "draft",
})

export const newConsultation = (now = new Date()): Consultation => ({
  id: null,
  projectId: null,
  kind: "opinion",
  title: "",
  question: "",
  description: [],
  options: [],
  opensAt: now.toISOString(),
  closesAt: new Date(now.getTime() + 14 * 86_400_000).toISOString(),
  state: "draft",
})

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(iso)) : "—"
export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso)) : "—"

/** F76 (L26) : avis des habitants sur les services (sans identité). */
export type ServiceReviewStatus = "received" | "read" | "answered"
export type ServiceReview = {
  id: string
  reference: string
  serviceId: string
  serviceName: string
  period: string
  rating: 1 | 2 | 3 | 4 | 5
  needMet: "yes" | "partly" | "no"
  comment: string | null
  context: "service" | "request" | "appointment"
  contextReference: string | null
  status: ServiceReviewStatus
  response: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
}
export type ServiceReviewQueue = { items: ServiceReview[]; ratings: Record<string, { average: number; count: number }> }
export type ServiceReviewAction = { reviewId: string; action: "read" | "respond"; response: string | null }
export const REVIEW_STATUS_LABELS: Record<ServiceReviewStatus, string> = { received: "Nouveau", read: "Lu par le service", answered: "Réponse envoyée" }
export const SCORE_LABELS: Record<number, string> = { 1: "Très insatisfait", 2: "Plutôt insatisfait", 3: "Moyen", 4: "Plutôt satisfait", 5: "Très satisfait" }
export const NEED_MET_LABELS = { yes: "Oui", partly: "En partie", no: "Non" } as const
export const CONTEXT_LABELS = { service: "Depuis la fiche du service", request: "Après une demande close", appointment: "Après un rendez-vous" } as const
