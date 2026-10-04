import type { Publication } from "./publication"

/**
 * Alerte de la ville (D18, F29, F31). Propriétaire : Communication.
 * Gravité, période de validité, audience (tous, un quartier, consentants aux alertes sanitaires)
 * et recommandations rédigées par les agents.
 */
export type AlertSeverity = "info" | "warning" | "critical"
export type AlertAudience = "all" | "district" | "health"

export type CityAlert = {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  audience: AlertAudience
  district: string | null
  startsAt: string
  endsAt: string
  recommendations: string[]
  publishedAt: string | null
  /** F73 : `official` = message officiel du Haut Conseil (tous les habitants, signé). */
  category?: "standard" | "official"
  signatory?: string | null
  /** Archive des messages officiels : encore en cours de validité. */
  active?: boolean
  /** F101/F104 : nature de l’événement (coupure d’électricité, tempête solaire…) et zone touchée en clair. */
  kind?: AlertKind
  area?: string
  /** F101 : `upcoming` = publiée mais pas encore commencée (annoncée jusqu’à 12 h avant). */
  status?: "active" | "upcoming"
}

export type AlertKind = "general" | "power" | "network" | "solar-storm" | "transport" | "weather" | "water" | "health"

export const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  general: "Information de la ville",
  power: "Coupure d’électricité",
  network: "Panne des communications",
  "solar-storm": "Tempête solaire",
  transport: "Transports perturbés",
  weather: "Météo dangereuse",
  water: "Eau potable",
  health: "Santé"
}

/** Moment d’une alerte à l’instant `now` : le bandeau l’affiche au bon moment, sans attendre un rechargement. */
export function alertTiming(alert: Pick<CityAlert, "startsAt" | "endsAt">, now: number): "upcoming" | "active" | "ended" {
  if (now < Date.parse(alert.startsAt)) return "upcoming"
  return now < Date.parse(alert.endsAt) ? "active" : "ended"
}

/** Prochain changement (début ou fin) d’une des alertes, pour réafficher le bandeau à cet instant précis. */
export function nextAlertChange(alerts: Pick<CityAlert, "startsAt" | "endsAt">[], now: number): number | null {
  const moments = alerts.flatMap((alert) => [Date.parse(alert.startsAt), Date.parse(alert.endsAt)]).filter((moment) => moment > now)
  return moments.length === 0 ? null : Math.min(...moments)
}

/**
 * F101 : une alerte de quartier concerne la personne si c’est son quartier ; sans quartier connu,
 * toutes les alertes sont montrées (avec le nom du quartier) pour ne laisser personne sans information.
 */
export function concernsDistrict(alert: Pick<CityAlert, "audience" | "district">, district: string | null): boolean {
  return alert.audience !== "district" || district === null || alert.district === district
}

const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })
const dayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" })

/** « 14:30 » aujourd’hui, sinon « mardi 6 octobre à 14:30 ». */
export function formatMoment(iso: string, now = Date.now()): string {
  const date = new Date(iso)
  return new Date(now).toDateString() === date.toDateString() ? timeFormat.format(date) : `${dayFormat.format(date)} à ${timeFormat.format(date)}`
}

/** « dans 25 min », « dans 2 h » : délai lisible avant le début d’une alerte annoncée. */
export function formatDelay(iso: string, now = Date.now()): string {
  const minutes = Math.max(1, Math.round((Date.parse(iso) - now) / 60_000))
  if (minutes < 60) return `dans ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `dans ${hours} h` : `dans ${hours} h ${String(rest).padStart(2, "0")}`
}

/** Consignes enregistrées sur l’appareil (F93, F104) : relues quand le réseau est coupé. */
export type SavedAlerts = { alerts: CityAlert[]; savedAt: string }

export const isOfficialMessage = (alert: Pick<CityAlert, "category">) => alert.category === "official"

/** Notifications du citoyen connecté : alertes qui le concernent et annonces importantes (F30). */
export type CitizenNotifications = { alerts: CityAlert[]; announcements: Publication[] }

/** Ce que la ville utilise pour cibler les alertes : quartier du profil et consentement sanitaire. */
export type AlertPreference = { district: string | null; healthConsent: boolean }

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Information",
  warning: "Vigilance",
  critical: "Urgence"
}

export const audienceLabel = (alert: Pick<CityAlert, "audience" | "district">) =>
  alert.audience === "district" ? `Quartier ${alert.district ?? ""}`.trim()
    : alert.audience === "health" ? "Alerte sanitaire (personnes inscrites)"
      : "Tous les habitants"

/** Fusionne des listes d’alertes sans doublon, la plus grave d’abord. */
export function mergeAlerts(...lists: CityAlert[][]): CityAlert[] {
  const rank: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
  const byId = new Map<string, CityAlert>()
  for (const alert of lists.flat()) byId.set(alert.id, alert)
  return [...byId.values()].sort((a, b) => rank[a.severity] - rank[b.severity] || Date.parse(b.startsAt) - Date.parse(a.startsAt))
}

const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" })

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso))
