/** Rendez-vous vus par les agents (Citizen L10) — contrat `api/src/Citizen/doc/rendez-vous.md`. */
export type DaySlot = {
  id: string
  serviceId: string
  serviceName: string
  startsAt: string
  endsAt: string
  durationMinutes: number
  location: string
  instructions: string
  when: string
  booked: boolean
  appointment: { id: string; reference: string; status: "confirmed" | "cancelled"; citizenName: string; citizenPhone: string | null; maskedFields?: string[] } | null
}

export type AppointmentDay = {
  date: string
  timezone: string
  timezoneLabel: string
  items: DaySlot[]
  bookedCount: number
  canManage: boolean
  services: { id: string; name: string; place: string }[]
  /** F70 : téléphone des citoyens masqué par l’API sauf affichage explicite (agent habilité, journalisé). */
  sensitive?: { revealed: boolean; canReveal: boolean }
}

export type AppointmentDayQuery = { date: string; reveal: boolean }

export type SlotSeries = {
  serviceId: string
  date: string
  startTime: string
  durationMinutes: number
  count: number
  location: string | null
  instructions: string | null
}

/** Inquiétudes des habitants (Citizen L14, F51) — contrat `api/src/Citizen/doc/participation.md`. */
export type ConcernStatus = "received" | "in_review" | "answered"

export type AgentConcern = {
  id: string
  reference: string
  topic: "data" | "service" | "security" | "other"
  subject: string
  message: string
  status: ConcernStatus
  response: string | null
  trail: { status: ConcernStatus; at: string; comment: string | null }[]
  createdAt: string
  updatedAt: string
}

export type ConcernQueue = { items: AgentConcern[]; receivedCount: number; canProcess: boolean }

export type ConcernHandling = { concernId: string; status: "in_review" | "answered"; comment: string | null }

export const CONCERN_TOPIC_LABELS: Record<AgentConcern["topic"], string> = {
  data: "Données personnelles",
  service: "Service de la ville",
  security: "Sécurité du compte",
  other: "Autre",
}

export const CONCERN_STATUS_LABELS: Record<ConcernStatus, string> = {
  received: "Reçue",
  in_review: "Prise en compte",
  answered: "Répondue",
}

/** Heure locale de la ville lue dans la chaîne ISO (indépendante du fuseau du navigateur). */
export const localTime = (iso: string) => iso.slice(11, 16)

/** Date locale du jour au format `YYYY-MM-DD` dans le fuseau de la ville (La Réunion). */
export const cityToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Reunion" }).format(new Date())
