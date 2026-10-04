/**
 * Service municipal présenté sur la vitrine.
 * Le catalogue appartient à Administration (`GET /administration/services`) ;
 * ce modèle est la vue consommée par le site.
 */
export const SERVICE_CATEGORIES = {
  demarches: "Papiers et citoyenneté",
  "cadre-de-vie": "Cadre de vie",
  "sante-solidarite": "Santé et solidarité",
  mobilite: "Mobilité",
  habitat: "Habitat",
  famille: "Famille et éducation",
  /** F74 (L26) : associations partenaires de la ville (page `/partenaires`). */
  partenaires: "Associations partenaires"
} as const

export const PARTNER_CATEGORY = "partenaires"

export type ServiceCategory = keyof typeof SERVICE_CATEGORIES

export type ServiceStatus = "available" | "maintenance" | "incident"

export type TransportInformation = { route: string; timetable: string; information: string }

export type MunicipalService = {
  id: string
  name: string
  category: ServiceCategory
  summary: string
  description: string
  actions: string[]
  contact: ServiceContact
  /** Mis en avant sur l’accueil (service prioritaire ou très demandé). */
  featured: boolean
  keywords: string[]
  /** État du service (F38) : une perturbation est expliquée avant toute démarche. */
  status: ServiceStatus
  statusMessage: string
  /** Date ISO de retour prévue, si connue. */
  returnAt: string | null
  /** Que faire en attendant (autre guichet, téléservice…). */
  alternative: string
  /** Horaires et informations des transports municipaux (F36), pour un service de mobilité. */
  transport: TransportInformation | null
  /** F45 : adresse et coordonnées du lieu d’accueil, si le service a un lieu physique. */
  location?: ServiceLocation | null
  /** F46 : type de service d’urgence (hôpital, urgences, pompiers, police, pharmacie de garde). */
  emergency?: EmergencyKind | null
  /** F27 : traductions saisies par les agents (le français fait foi). */
  translations?: Partial<Record<"en" | "ar", ServiceTranslation>> | Record<string, never>
  /** F63 : désactivé en urgence par la mairie — aucune nouvelle demande ni réservation ; `disabledReason` l’explique. */
  disabled?: boolean
  disabledReason?: string
  /** F89 : version en langage clair, relue et validée par un agent (vide si absente). */
  plainLanguage?: string
}

/** F74 : horaires structurés (jour 1 = lundi … 7 = dimanche, `HH:MM`) et contact d’une association partenaire. */
export type OpeningSlot = { day: number; opens: string; closes: string }
export type ServiceContact = {
  place: string
  hours: string
  phone?: string | null
  person?: string
  email?: string
  website?: string
  openingHours?: OpeningSlot[]
}

export type ServiceLocation = { address: string; district: string | null; lat: number; lng: number }
export type EmergencyKind = "hospital" | "emergency" | "fire" | "police" | "pharmacy"
export type ServiceTranslation = { name: string; summary: string; description: string }

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  available: "Service disponible",
  maintenance: "Service en maintenance",
  incident: "Service perturbé (incident)"
}

export const isDisrupted = (service: Pick<MunicipalService, "status">) => service.status !== "available"

/** F64 : état affiché avant toute démarche — désactivé (bloquant), perturbé (démarche possible, avec réserve) ou disponible. */
export type ServiceAvailability = "disabled" | "disrupted" | "available"

export const serviceAvailability = (service: Pick<MunicipalService, "status" | "disabled">): ServiceAvailability =>
  service.disabled ? "disabled" : isDisrupted(service) ? "disrupted" : "available"

export type ServiceFilter = { query?: string; category?: ServiceCategory | null }

/** Minuscules sans accents, pour une recherche tolérante. */
export const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

export const isServiceCategory = (value: string | null | undefined): value is ServiceCategory =>
  Boolean(value && Object.hasOwn(SERVICE_CATEGORIES, value))

export function filterServices(services: MunicipalService[], filter: ServiceFilter): MunicipalService[] {
  const terms = normalizeText(filter.query ?? "").split(/\s+/).filter(Boolean)
  return services.filter((service) => {
    if (filter.category && service.category !== filter.category) return false
    if (terms.length === 0) return true
    const haystack = normalizeText(
      [service.name, service.summary, SERVICE_CATEGORIES[service.category], ...service.keywords].join(" ")
    )
    return terms.every((term) => haystack.includes(term))
  })
}

export const featuredServices = (services: MunicipalService[], limit = 4) =>
  services.filter((service) => service.featured).slice(0, limit)

export const findService = (services: MunicipalService[], id: string | null | undefined) =>
  services.find((service) => service.id === id) ?? null

/** Fuseau de la ville (heure de La Réunion, comme les rendez-vous). */
export const CITY_TIME_ZONE = "Indian/Reunion"

/** Jour (1 = lundi … 7 = dimanche) et heure `HH:MM` dans le fuseau de la ville. */
export function cityClock(now: Date): { day: number; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: CITY_TIME_ZONE, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday")) + 1
  return { day, time: `${get("hour")}:${get("minute")}` }
}

/**
 * F74 : « Ouvert maintenant, ferme à 18 h » ou « Fermé, ouvre lundi à 9 h ».
 * `null` quand les horaires structurés ne sont pas renseignés.
 */
export type OpeningState = { open: true; closes: string } | { open: false; opensDay: number; opens: string; sameDay: boolean } | null

export function openingState(slots: OpeningSlot[] | undefined, now: Date): OpeningState {
  if (!slots || slots.length === 0) return null
  const { day, time } = cityClock(now)
  const current = slots.find((slot) => slot.day === day && slot.opens <= time && time < slot.closes)
  if (current) return { open: true, closes: current.closes }
  for (let offset = 0; offset < 8; offset++) {
    const target = ((day - 1 + offset) % 7) + 1
    const next = slots
      .filter((slot) => slot.day === target && (offset > 0 || slot.opens > time))
      .sort((a, b) => a.opens.localeCompare(b.opens))[0]
    if (next) return { open: false, opensDay: target, opens: next.opens, sameDay: offset === 0 }
  }
  return null
}

/** « 18 h », « 9 h 30 ». */
export const spokenTime = (value: string) => {
  const [hours, minutes] = value.split(":")
  return `${Number(hours)} h${minutes && minutes !== "00" ? ` ${minutes}` : ""}`
}
