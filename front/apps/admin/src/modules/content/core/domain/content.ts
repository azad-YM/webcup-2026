/**
 * Contenus gérés par les agents : services municipaux (BC Administration),
 * publications et alertes (BC Communication). Les règles font autorité côté API.
 */
export const SERVICE_CATEGORIES = {
  demarches: "Démarches et citoyenneté",
  "cadre-de-vie": "Cadre de vie",
  "sante-solidarite": "Santé et solidarité",
  mobilite: "Mobilité",
  habitat: "Habitat",
  famille: "Famille et éducation",
} as const

export type ServiceCategory = keyof typeof SERVICE_CATEGORIES
export type ServiceStatus = "available" | "maintenance" | "incident"

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  available: "Disponible",
  maintenance: "En maintenance",
  incident: "Incident",
}

export type MunicipalService = {
  id: string
  name: string
  category: ServiceCategory
  summary: string
  description: string
  actions: string[]
  contact: { place: string; hours: string; phone: string | null }
  featured: boolean
  keywords: string[]
  status: ServiceStatus
  statusMessage: string
  returnAt: string | null
  alternative: string
  transport: { route: string; timetable: string; information: string } | null
  updatedAt?: string
  /** F63 : désactivation d’urgence (nouvelles demandes et rendez-vous refusés), motif montré aux habitants. */
  disabled?: boolean
  disabledReason?: string
  disabledAt?: string | null
}

/** F63 : désactiver (motif obligatoire, 5 à 500 caractères) ou réactiver un service. */
export type ServiceAvailabilityChange = { id: string; disabled: boolean; reason: string }

export const DISABLE_REASON_MIN = 5
export const DISABLE_REASON_MAX = 500

export type ContentState = "draft" | "published" | "withdrawn"

export const STATE_LABELS: Record<ContentState, string> = {
  draft: "Brouillon",
  published: "Publiée",
  withdrawn: "Retirée",
}

export type Publication = {
  id: string | null
  title: string
  category: string
  summary: string
  body: string[]
  important: boolean
  state: ContentState
  publishedAt?: string | null
  updatedAt?: string
}

export type AlertSeverity = "info" | "warning" | "critical"
export type AlertAudience = "all" | "district" | "health"

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Information",
  warning: "Vigilance",
  critical: "Urgence",
}

export const AUDIENCE_LABELS: Record<AlertAudience, string> = {
  all: "Tous les habitants",
  district: "Un quartier",
  health: "Personnes inscrites aux alertes sanitaires",
}

export type Alert = {
  id: string | null
  title: string
  message: string
  severity: AlertSeverity
  audience: AlertAudience
  district: string | null
  /** ISO 8601. */
  startsAt: string
  endsAt: string
  /** Recommandations rédigées par l’agent, une par ligne (F31). */
  recommendations: string[]
  state: ContentState
  publishedAt?: string | null
  updatedAt?: string
}

/** Texte multiligne ↔ liste de paragraphes (lignes vides ignorées). */
export const toLines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean)
export const fromLines = (lines: string[]) => lines.join("\n")

/** `datetime-local` (heure locale) ↔ ISO 8601. */
export const toLocalInput = (iso: string) => {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
export const fromLocalInput = (value: string) => new Date(value).toISOString()

export const newPublication = (): Publication => ({
  id: null, title: "", category: "Vie municipale", summary: "", body: [], important: false, state: "draft",
})

export const newAlert = (now = new Date()): Alert => ({
  id: null,
  title: "",
  message: "",
  severity: "warning",
  audience: "all",
  district: null,
  startsAt: now.toISOString(),
  endsAt: new Date(now.getTime() + 24 * 3_600_000).toISOString(),
  recommendations: [],
  state: "draft",
})

export const newService = (): MunicipalService => ({
  id: "",
  name: "",
  category: "demarches",
  summary: "",
  description: "",
  actions: [],
  contact: { place: "", hours: "", phone: null },
  featured: false,
  keywords: [],
  status: "available",
  statusMessage: "",
  returnAt: null,
  alternative: "",
  transport: null,
})

export const isAlertActive = (alert: Alert, now = Date.now()) =>
  alert.state === "published" && Date.parse(alert.startsAt) <= now && now < Date.parse(alert.endsAt)
