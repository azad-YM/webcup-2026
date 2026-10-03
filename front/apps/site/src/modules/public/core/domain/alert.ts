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
}

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
