/**
 * Service municipal présenté sur la vitrine.
 * Le catalogue appartient à Administration (lot L3) ; ce modèle est la vue
 * consommée par le site.
 */
export const SERVICE_CATEGORIES = {
  demarches: "Démarches et citoyenneté",
  "cadre-de-vie": "Cadre de vie",
  "sante-solidarite": "Santé et solidarité",
  mobilite: "Mobilité",
  habitat: "Habitat",
  famille: "Famille et éducation"
} as const

export type ServiceCategory = keyof typeof SERVICE_CATEGORIES

export type MunicipalService = {
  id: string
  name: string
  category: ServiceCategory
  summary: string
  description: string
  actions: string[]
  contact: { place: string; hours: string; phone?: string }
  /** Mis en avant sur l’accueil (service prioritaire ou très demandé). */
  featured: boolean
  keywords: string[]
  status?: "operational" | "maintenance" | "interrupted"
  statusMessage?: string
  transport?: { route: string; timetable: string; information: string } | null
}

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
