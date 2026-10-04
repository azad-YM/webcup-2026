import type { Locale } from "@/modules/shared/core/i18n/locales"
import { normalizeText, type MunicipalService } from "./municipal-service"

/**
 * Recherche tolérante des services (D10) et explications simples (F90), fournies par le BC Assistance
 * (`/assistance/services/search`, `/assistance/explanations`). `source` dit si la réponse vient du
 * modèle de langage (`model`) ou du repli local sans IA (`local`).
 */
export type AssistanceSource = "model" | "local"

export type ServiceSearchHit = { id: string; name: string; score: number; status: string; disabled: boolean; emergency: string | null }

export type ServiceSearchResult = {
  query: string
  results: ServiceSearchHit[]
  /** « Vous vouliez dire… » : la recherche corrigée, si une faute de frappe a été repérée. */
  suggestion: string | null
  /** Demande reformulée par le modèle (recherche assistée). */
  reformulation: string | null
  source: AssistanceSource
  modelAvailable: boolean
}

export type ServiceSearchParams = { query: string; locale: Locale }

export type DifficultTerm = { term: string; definition: string }

export type Explanation = {
  explanation: string | null
  terms: DifficultTerm[]
  source: AssistanceSource
  modelAvailable: boolean
}

export type ExplainParams = { text: string; locale: Locale }

/** Ordonne les services selon le classement de l’API ; les services absents du classement sont écartés. */
export function rankServices(services: MunicipalService[], hits: ServiceSearchHit[]): MunicipalService[] {
  const byId = new Map(services.map((service) => [service.id, service]))
  return hits.map((hit) => byId.get(hit.id)).filter((service): service is MunicipalService => service !== undefined)
}

/** Mots du glossaire du site repérés dans un passage (repli local de F90). */
export function findGlossaryTerms<T extends { term: string }>(text: string, entries: T[]): T[] {
  const haystack = ` ${normalizeText(text).replace(/[^\p{L}\p{N}]+/gu, " ")} `
  return entries.filter((entry) => {
    const needle = normalizeText(entry.term).replace(/[^\p{L}\p{N}]+/gu, " ").trim()
    return needle.length > 2 && (haystack.includes(` ${needle} `) || haystack.includes(` ${needle}s `))
  })
}
