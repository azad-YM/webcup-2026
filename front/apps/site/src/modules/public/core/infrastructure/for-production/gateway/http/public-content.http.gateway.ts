import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { PublicationGateway } from "../../../../application/ports/gateway/publication.gateway"
import type { ServiceCatalogGateway } from "../../../../application/ports/gateway/service-catalog.gateway"
import type { MunicipalService } from "../../../../domain/municipal-service"
import type { Publication } from "../../../../domain/publication"

/**
 * Contenus publics de la ville : catalogue des services (Administration)
 * et publications (Communication). Lecture sans compte.
 */
export class HttpPublicContentGateway implements ServiceCatalogGateway, PublicationGateway {
  constructor(private readonly apiBaseUrl: string) {}

  private async read<T>(path: string, what: string): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.apiBaseUrl.replace(/\/$/, "")}${path}`, { headers: { Accept: "application/json" } })
    } catch {
      throw new AppError("NETWORK_ERROR", `Impossible de charger ${what}. Vérifiez votre connexion puis réessayez.`)
    }
    if (!response.ok) throw new AppError(response.status, `Impossible de charger ${what} pour le moment. Réessayez dans quelques instants.`)
    return (await response.json()) as T
  }

  listServices() {
    return this.read<MunicipalService[]>("/administration/services", "les services")
  }

  listPublications() {
    return this.read<Publication[]>("/communication/publications", "les actualités")
  }
}
