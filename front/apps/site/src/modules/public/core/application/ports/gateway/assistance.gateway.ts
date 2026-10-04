import type { Explanation, ExplainParams, ServiceSearchParams, ServiceSearchResult } from "../../../domain/service-search"

/** D10 : recherche tolérante des services (BC Assistance). `refine` peut appeler le modèle de langage. */
export interface ServiceFinderGateway {
  search(params: ServiceSearchParams): Promise<ServiceSearchResult>
  refine(params: ServiceSearchParams): Promise<ServiceSearchResult>
}

/** F90 : explication plus simple d’un passage (BC Assistance). */
export interface ExplanationGateway {
  explain(params: ExplainParams): Promise<Explanation>
}
