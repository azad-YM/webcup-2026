import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { ExplanationGateway, ServiceFinderGateway } from "../../../../application/ports/gateway/assistance.gateway"
import type { Explanation, ExplainParams, ServiceSearchParams, ServiceSearchResult } from "../../../../domain/service-search"

/** Assistance aux habitants (BC Assistance), sans compte. Les routes POST sont limitées par adresse IP (429). */
export class AssistanceHttpGateway implements ServiceFinderGateway, ExplanationGateway {
  constructor(private readonly apiBaseUrl: string) {}

  private async call<T>(path: string, what: string, body?: unknown): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.apiBaseUrl.replace(/\/$/, "")}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body)
      })
    } catch {
      throw new AppError("NETWORK_ERROR", `Impossible de joindre le serveur pour ${what}. Vérifiez votre connexion.`)
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
      const message = response.status === 429 || response.status === 422 ? payload?.message ?? payload?.error : undefined
      throw new AppError(response.status, message ?? `${what[0]?.toUpperCase()}${what.slice(1)} ne répond pas pour le moment. Réessayez dans quelques instants.`)
    }
    return (await response.json()) as T
  }

  search({ query, locale }: ServiceSearchParams) {
    return this.call<ServiceSearchResult>(`/assistance/services/search?${new URLSearchParams({ q: query, lang: locale })}`, "la recherche")
  }

  refine({ query, locale }: ServiceSearchParams) {
    return this.call<ServiceSearchResult>("/assistance/services/search", "la recherche assistée", { query, language: locale })
  }

  explain({ text, locale }: ExplainParams) {
    return this.call<Explanation>("/assistance/explanations", "l’explication", { text, language: locale })
  }
}
