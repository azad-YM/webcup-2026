/**
 * ADAPTATEURS LOCAUX — plus branchés sur le site (lot L3 livré : adaptateur HTTP
 * `HttpPublicContentGateway`). Conservés uniquement pour les tests existants.
 */
import type { PublicationGateway } from "../../../../application/ports/gateway/publication.gateway"
import type { ServiceCatalogGateway } from "../../../../application/ports/gateway/service-catalog.gateway"
import { DEMO_PUBLICATIONS, DEMO_SERVICES } from "./demo-content"

const copy = <T>(items: T[]): T[] => structuredClone(items)

export class LocalServiceCatalogGateway implements ServiceCatalogGateway {
  async listServices() {
    return copy(DEMO_SERVICES)
  }
}

export class LocalPublicationGateway implements PublicationGateway {
  async listPublications() {
    return copy(DEMO_PUBLICATIONS)
  }
}
