/**
 * Participation des habitants (BC Participation, lot L19) : projets (F67), consultations et avis (F65, F66),
 * boîte à idées (F68). Contrat : `api/src/Participation/doc/README.md`.
 */
export type ProjectStatus = "study" | "in_progress" | "done"
export type ConsultationKind = "opinion" | "consultation"
export type ConsultationPhase = "upcoming" | "open" | "closed"
export type Rating = "positive" | "mixed" | "negative"
export type IdeaStatus = "received" | "in_review" | "accepted" | "rejected" | "done"

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = { study: "À l’étude", in_progress: "En cours", done: "Terminé" }
export const PHASE_LABELS: Record<ConsultationPhase, string> = { upcoming: "Bientôt ouverte", open: "Ouverte", closed: "Terminée" }
export const KIND_LABELS: Record<ConsultationKind, string> = { opinion: "Donner son avis", consultation: "Consultation" }
export const RATING_LABELS: Record<Rating, string> = { positive: "Plutôt favorable", mixed: "Partagé", negative: "Plutôt défavorable" }
export const RATINGS: Rating[] = ["positive", "mixed", "negative"]
export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  received: "Reçue",
  in_review: "À l’étude",
  accepted: "Retenue",
  rejected: "Non retenue",
  done: "Réalisée",
}

export type ProjectStep = { label: string; date: string; done: boolean }

export type ConsultationOption = { id: string; label: string }

export type ConsultationResults = {
  total: number
  choices: (ConsultationOption & { count: number })[]
  ratings: { rating: Rating; count: number }[]
  comments: number
}

export type Consultation = {
  id: string
  projectId: string | null
  projectTitle?: string | null
  kind: ConsultationKind
  official: false
  title: string
  question: string
  description: string[]
  options: ConsultationOption[]
  opensAt: string
  closesAt: string
  phase: ConsultationPhase
  contributionCount: number
  results: ConsultationResults | null
  outcome: { text: string[]; publishedAt: string | null } | null
}

export type Project = {
  id: string
  title: string
  summary: string
  description: string[]
  district: string | null
  status: ProjectStatus
  steps: ProjectStep[]
  nextStep: string | null
  publishedAt: string | null
  updatedAt: string
  consultations?: Consultation[]
}

export type ProjectFilters = { district: string; status: ProjectStatus | "" }

export type ContributionDraft = { consultationId: string; choice: string | null; rating: Rating | null; comment: string }

/** Accusé de réception d’une contribution. */
export type ContributionReceipt = {
  id: string
  reference: string
  consultationId: string
  choice: string | null
  rating: Rating | null
  comment: string | null
  submittedAt: string
  updatedAt: string
  revised: boolean
}

export type MyContribution = ContributionReceipt & {
  consultation: {
    id: string
    title: string
    kind: ConsultationKind
    options: ConsultationOption[]
    closesAt: string
    phase: ConsultationPhase
    visible: boolean
  } | null
}

export type Idea = {
  id: string
  reference: string
  title: string
  description: string
  district: string | null
  status: IdeaStatus
  statusComment: string | null
  createdAt: string
  updatedAt: string
}

export type MyIdea = Idea & {
  public: boolean
  hiddenReason: string | null
  trail: { status: IdeaStatus; at: string; comment: string | null }[]
}

export type IdeaDraft = { title: string; description: string; district: string }

export type MyParticipation = { contributions: MyContribution[]; ideas: MyIdea[] }

export const IDEA_LIMITS = { title: 160, description: 5000 } as const
export const COMMENT_MAX = 3000

export function validateIdea(draft: IdeaDraft): Partial<Record<"title" | "description", string>> {
  const errors: Partial<Record<"title" | "description", string>> = {}
  if (!draft.title.trim()) errors.title = "Donnez un titre à votre idée."
  else if (draft.title.trim().length > IDEA_LIMITS.title) errors.title = `Le titre ne doit pas dépasser ${IDEA_LIMITS.title} caractères.`
  if (!draft.description.trim()) errors.description = "Décrivez votre idée."
  else if (draft.description.trim().length > IDEA_LIMITS.description) errors.description = `La description ne doit pas dépasser ${IDEA_LIMITS.description} caractères.`
  return errors
}

/** Message d’erreur de saisie avant envoi, selon le type de consultation. */
export function validateContribution(consultation: Consultation, draft: ContributionDraft): string | null {
  if (draft.comment.trim().length > COMMENT_MAX) return `Votre commentaire ne doit pas dépasser ${COMMENT_MAX} caractères.`
  if (consultation.kind === "consultation" && !draft.choice) return "Choisissez l’une des réponses proposées."
  if (consultation.kind === "opinion" && !draft.rating && !draft.comment.trim()) return "Donnez une appréciation ou écrivez votre avis."
  return null
}

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(iso)) : ""
export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso)) : ""

export const percent = (count: number, total: number) => (total === 0 ? 0 : Math.round((count / total) * 100))

/** Code d’erreur : le compte connecté n’a pas d’espace citoyen (404 sur `/participation/me…`). */
export const NOT_CITIZEN = "not-citizen"
