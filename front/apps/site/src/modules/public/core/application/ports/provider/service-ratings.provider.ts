/** F76 : moyenne et nombre d’avis d’un service (agrégat public, sans identité). */
export type ServiceRatingSummary = { serviceId: string; average: number; count: number }

/**
 * Notes des services, fournies par le module `participation` (BC Participation) :
 * adaptateur `participation/core/infrastructure/adapter/public/participation-service-ratings.adapter.ts`.
 */
export interface ServiceRatingsProvider {
  ratingOf(serviceId: string): Promise<ServiceRatingSummary | null>
}
