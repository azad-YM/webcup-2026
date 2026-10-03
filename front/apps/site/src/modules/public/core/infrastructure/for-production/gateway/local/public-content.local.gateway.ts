/**
 * ADAPTATEURS LOCAUX — pas une intégration API.
 *
 * Ils servent le contenu de démonstration de `demo-content.ts` tant que
 * Administration n’expose pas le catalogue et les publications (lot L3).
 * Au lot L3, les remplacer dans `StoreProvider` par des adaptateurs HTTP
 * implémentant les mêmes ports.
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
