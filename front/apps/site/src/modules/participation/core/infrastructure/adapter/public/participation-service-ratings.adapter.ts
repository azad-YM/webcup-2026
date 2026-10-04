import type { ServiceRatingSummary, ServiceRatingsProvider } from "@/modules/public/core/application/ports/provider/service-ratings.provider"
import type { CityParticipationGateway } from "../../../application/ports/gateway/city-participation.gateway"

/** F76 : le module public lit la note d’un service auprès de Participation, par son port. */
export class ParticipationServiceRatingsAdapter implements ServiceRatingsProvider {
  constructor(private readonly gateway: CityParticipationGateway) {}

  async ratingOf(serviceId: string): Promise<ServiceRatingSummary | null> {
    const [rating] = await this.gateway.listServiceRatings(serviceId)
    return rating ? { serviceId: rating.serviceId, average: rating.average, count: rating.count } : null
  }
}
