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
  famille: "Famille et éducation"
} as const

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
  contact: { place: string; hours: string; phone?: string | null }
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
  /** F63 : désactivé en urgence par la mairie — aucune nouvelle demande ni réservation ; `disabledReason` l’explique. */
  disabled?: boolean
  disabledReason?: string
}

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
