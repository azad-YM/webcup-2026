import type { EmergencyKind, MunicipalService, ServiceLocation } from "./municipal-service"

/**
 * Lieux des services (F45, F46) et textes traduits (F27). Règles d’affichage du site ;
 * les données (adresse, coordonnées, type d’urgence, traductions) appartiennent à Administration.
 */
export type PlacedService = MunicipalService & { location: ServiceLocation }
export type Position = { lat: number; lng: number }

export const EMERGENCY_KINDS: EmergencyKind[] = ["emergency", "hospital", "pharmacy", "police", "fire"]

export const hasLocation = (service: MunicipalService): service is PlacedService =>
  Boolean(service.location && Number.isFinite(service.location.lat) && Number.isFinite(service.location.lng))

/** Hôpitaux et urgences d’abord, puis pharmacie de garde, police, pompiers. */
export function emergencyServices(services: MunicipalService[]): MunicipalService[] {
  return services
    .filter((service) => service.emergency)
    .sort((a, b) => EMERGENCY_KINDS.indexOf(a.emergency!) - EMERGENCY_KINDS.indexOf(b.emergency!))
}

/** Distance à vol d’oiseau en kilomètres (formule de haversine). */
export function distanceKm(from: Position, to: Position): number {
  const rad = (value: number) => (value * Math.PI) / 180
  const dLat = rad(to.lat - from.lat)
  const dLng = rad(to.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function sortByDistance<T extends MunicipalService>(services: T[], position: Position | null): T[] {
  if (!position) return services
  const distance = (service: T) => (hasLocation(service) ? distanceKm(position, service.location) : Number.POSITIVE_INFINITY)
  return [...services].sort((a, b) => distance(a) - distance(b))
}

/** Itinéraire OpenStreetMap jusqu’au lieu (le point de départ est choisi sur le site d’OpenStreetMap). */
export const directionsUrl = (location: Position) =>
  `https://www.openstreetmap.org/directions?route=%3B${location.lat}%2C${location.lng}`

export const openStreetMapUrl = (location: Position) =>
  `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=18/${location.lat}/${location.lng}`

export type LocalizedService = {
  name: string
  summary: string
  description: string
  /** Vrai si un texte affiché est resté en français faute de traduction. */
  untranslated: boolean
  descriptionUntranslated: boolean
}

/** F27 : textes dans la langue choisie, repli en français texte par texte. */
export function localizeService(service: MunicipalService, locale: string): LocalizedService {
  if (locale === "fr") return { name: service.name, summary: service.summary, description: service.description, untranslated: false, descriptionUntranslated: false }
  const translation = (service.translations as Record<string, Partial<Record<"name" | "summary" | "description", string>>> | undefined)?.[locale]
  const pick = (key: "name" | "summary" | "description") => {
    const value = translation?.[key]?.trim()
    return value ? { text: value, translated: true } : { text: service[key], translated: false }
  }
  const name = pick("name")
  const summary = pick("summary")
  const description = pick("description")
  return { name: name.text, summary: summary.text, description: description.text, untranslated: !name.translated || !summary.translated, descriptionUntranslated: !description.translated }
}

export const formatDistance = (km: number, locale: string) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(km)} km`
