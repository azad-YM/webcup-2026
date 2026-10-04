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
  /** F74 (L26) : association partenaire (page `/partenaires` du site, carte). */
  partenaires: "Association partenaire",
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
  contact: ServiceContact
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
  /** F45 : adresse et coordonnées du lieu d’accueil (carte du site). */
  location?: ServiceLocation | null
  /** F46 : service d’urgence (page « Urgences » du site). */
  emergency?: EmergencyKind | null
  /** F27 : traductions du nom, du résumé et de la description (le français fait foi). */
  translations?: Partial<Record<TranslationLanguage, ServiceTranslation>> | Record<string, never>
  /** F89 : version en langage clair, relue par l’agent ; l’enregistrer vaut validation. */
  plainLanguage?: string
}

/** F63 : désactiver (motif obligatoire, 5 à 500 caractères) ou réactiver un service. */
export type ServiceAvailabilityChange = { id: string; disabled: boolean; reason: string }

export const DISABLE_REASON_MIN = 5
export const DISABLE_REASON_MAX = 500

export type ServiceLocation = { address: string; district: string | null; lat: number; lng: number }
export type EmergencyKind = "hospital" | "emergency" | "fire" | "police" | "pharmacy"
export const EMERGENCY_LABELS: Record<EmergencyKind, string> = {
  hospital: "Hôpital",
  emergency: "Urgences",
  fire: "Pompiers",
  police: "Police",
  pharmacy: "Pharmacie de garde",
}
export type TranslationLanguage = "en" | "ar"
export const TRANSLATION_LANGUAGES: Record<TranslationLanguage, { label: string; dir: "ltr" | "rtl" }> = {
  en: { label: "Anglais", dir: "ltr" },
  ar: { label: "Arabe", dir: "rtl" },
}
export type ServiceTranslation = { name: string; summary: string; description: string }

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
  /** F89 : version en langage clair, relue par l’agent ; l’enregistrer vaut validation. */
  plainLanguage?: string
}

/** F89 : brouillon « En clair » proposé par l’API (modèle de langage ou repli local), jamais enregistré seul. */
export type PlainLanguageDraft = { text: string; source: "model" | "local" }
export type ServicePlainLanguageRequest = { name: string; summary: string; description: string }
export type PublicationPlainLanguageRequest = { title: string; summary: string; body: string[] }
export const PLAIN_LANGUAGE_MAX = 600

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
  /** F73 : `official` = message officiel du Haut Conseil (tous les habitants, signé). */
  category?: AlertCategory
  signatory?: string | null
  /** F73 : confirmation explicite avant de publier un message officiel (envoyée, jamais stockée). */
  confirmOfficial?: boolean
}

export type AlertCategory = "standard" | "official"

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

/** F73 : message officiel du Haut Conseil, adressé à tous, en tête de toutes les pages du site. */
export const newOfficialMessage = (now = new Date()): Alert => ({
  ...newAlert(now),
  severity: "info",
  audience: "all",
  endsAt: new Date(now.getTime() + 7 * 24 * 3_600_000).toISOString(),
  category: "official",
  signatory: "Le Haut Conseil de Nova Terra",
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

/** F74 : horaires structurés (jour 1 = lundi … 7 = dimanche) et contact d’une association partenaire. */
export type OpeningSlot = { day: number; opens: string; closes: string }
export type ServiceContact = {
  place: string
  hours: string
  phone: string | null
  person?: string
  email?: string
  website?: string
  openingHours?: OpeningSlot[]
}

export const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const

/** « 09:00-12:00, 14:00-18:00 » ↔ plages du jour. */
export const formatDaySlots = (slots: OpeningSlot[] | undefined, day: number) =>
  (slots ?? []).filter((slot) => slot.day === day).map((slot) => `${slot.opens}-${slot.closes}`).join(", ")

export function parseDaySlots(text: string, day: number): OpeningSlot[] | null {
  const ranges = text.split(",").map((part) => part.trim()).filter(Boolean)
  const slots: OpeningSlot[] = []
  for (const range of ranges) {
    const match = /^(\d{1,2})[:h](\d{2})\s*-\s*(\d{1,2})[:h](\d{2})$/.exec(range)
    if (!match) return null
    const [, openHour = "", openMinute = "", closeHour = "", closeMinute = ""] = match
    const opens = `${openHour.padStart(2, "0")}:${openMinute}`
    const closes = `${closeHour.padStart(2, "0")}:${closeMinute}`
    if (closes <= opens) return null
    slots.push({ day, opens, closes })
  }
  return slots
}
