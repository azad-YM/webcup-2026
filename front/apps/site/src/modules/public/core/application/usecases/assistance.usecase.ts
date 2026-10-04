import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Explanation, ExplainParams, ServiceSearchParams, ServiceSearchResult } from "../../domain/service-search"

/** D10 : classement tolérant, sans modèle (au fil de la saisie). */
export const searchServices: UseCase<ServiceSearchParams, ServiceSearchResult> = async (dependencies, params) =>
  dependencies.serviceFinderGateway.search(params)

/** D10 (IA) : reformulation et reclassement par le modèle, repli local côté API. */
export const refineServiceSearch: UseCase<ServiceSearchParams, ServiceSearchResult> = async (dependencies, params) =>
  dependencies.serviceFinderGateway.refine(params)

/** F90 : explication plus simple d’un passage. */
export const explainPassage: UseCase<ExplainParams, Explanation> = async (dependencies, params) =>
  dependencies.explanationGateway.explain(params)
