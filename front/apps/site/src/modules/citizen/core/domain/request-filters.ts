import type { RequestCategory, RequestStatus } from "./service-request"

/**
 * F79 : trier et filtrer les demandes consultées (« Mes demandes », signalements publics).
 * Les critères vivent dans l'adresse (`?q=&categorie=&etat=&quartier=&service=&tri=`) : export statique, lien partageable.
 */
export type RequestSort = "recent" | "ancien" | "soutiens"

export type RequestFilterState = {
  q: string
  category: RequestCategory | ""
  status: RequestStatus | ""
  district: string
  service: string
  sort: RequestSort
}

export type FilterableRequest = {
  reference: string
  subject: string
  location?: string | null
  description?: string
  status: RequestStatus
  createdAt: string
  category?: RequestCategory
  district?: string | null
  serviceId?: string | null
  supportCount?: number
}

export const FILTER_PARAMS = { q: "q", category: "categorie", status: "etat", district: "quartier", service: "service", sort: "tri" } as const

const SORTS: RequestSort[] = ["recent", "ancien", "soutiens"]

export function readFilters(params: { get(name: string): string | null }): RequestFilterState {
  const sort = params.get(FILTER_PARAMS.sort) as RequestSort | null
  return {
    q: params.get(FILTER_PARAMS.q) ?? "",
    category: (params.get(FILTER_PARAMS.category) ?? "") as RequestCategory | "",
    status: (params.get(FILTER_PARAMS.status) ?? "") as RequestStatus | "",
    district: params.get(FILTER_PARAMS.district) ?? "",
    service: params.get(FILTER_PARAMS.service) ?? "",
    sort: sort && SORTS.includes(sort) ? sort : "recent"
  }
}

/** Paramètres de requête à conserver (les autres paramètres de la page sont gardés par l'appelant). */
export function filtersToParams(filters: RequestFilterState, base: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(base)
  const values: Record<keyof typeof FILTER_PARAMS, string> = { ...filters, sort: filters.sort === "recent" ? "" : filters.sort }
  for (const key of Object.keys(FILTER_PARAMS) as (keyof typeof FILTER_PARAMS)[]) {
    const value = values[key].trim()
    if (value) next.set(FILTER_PARAMS[key], value)
    else next.delete(FILTER_PARAMS[key])
  }
  return next
}

const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function applyFilters<T extends FilterableRequest>(items: T[], filters: RequestFilterState): T[] {
  const words = normalize(filters.q).split(/\s+/).filter(Boolean)
  const kept = items.filter((item) => {
    if (filters.category && (item.category ?? "other") !== filters.category) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.district && item.district !== filters.district) return false
    if (filters.service && item.serviceId !== filters.service) return false
    if (words.length > 0) {
      const haystack = normalize(`${item.reference} ${item.subject} ${item.location ?? ""} ${item.description ?? ""}`)
      if (!words.every((word) => haystack.includes(word))) return false
    }
    return true
  })
  return [...kept].sort((a, b) => {
    if (filters.sort === "soutiens") return (b.supportCount ?? 0) - (a.supportCount ?? 0) || b.createdAt.localeCompare(a.createdAt)
    return filters.sort === "ancien" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
  })
}

export const hasActiveFilters = (filters: RequestFilterState) =>
  Boolean(filters.q || filters.category || filters.status || filters.district || filters.service)

/** Valeurs distinctes présentes dans la liste, pour proposer des choix réalistes. */
export function distinctValues<T>(items: T[], pick: (item: T) => string | null | undefined): string[] {
  return [...new Set(items.map(pick).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "fr"))
}
