import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { PublicationGateway } from "../../application/ports/gateway/publication.gateway"
import type { ServiceCatalogGateway } from "../../application/ports/gateway/service-catalog.gateway"
import type { MunicipalService } from "../../domain/municipal-service"
import type { Publication } from "../../domain/publication"

export class InMemoryServiceCatalogGateway implements ServiceCatalogGateway {
  constructor(public services: MunicipalService[] = [], public failing = false) {}
  async listServices() {
    if (this.failing) throw new AppError("NETWORK_ERROR", "Impossible de joindre le service. Réessayez.")
    return this.services
  }
}

export class InMemoryPublicationGateway implements PublicationGateway {
  constructor(public publications: Publication[] = [], public failing = false) {}
  async listPublications() {
    if (this.failing) throw new AppError("NETWORK_ERROR", "Impossible de joindre le service. Réessayez.")
    return this.publications
  }
}
