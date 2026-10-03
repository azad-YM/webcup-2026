import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { ServiceCatalogGateway } from "../../../../application/ports/gateway/service-catalog.gateway"
import type { PublicationGateway } from "../../../../application/ports/gateway/publication.gateway"
import type { MunicipalService } from "../../../../domain/municipal-service"
import type { Publication } from "../../../../domain/publication"
export class HttpPublicContentGateway implements ServiceCatalogGateway, PublicationGateway {
 constructor(private readonly baseUrl: string) {}
 private async read<T>(path: string): Promise<T> {
  let response: Response
  try { response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`) } catch { throw new AppError("NETWORK_ERROR", "La ville est momentanément inaccessible. Réessayez.") }
  if (!response.ok) throw new AppError(response.status, "Impossible de charger les informations de la ville.")
  return response.json() as Promise<T>
 }
 listServices() { return this.read<MunicipalService[]>("/administration/services") }
 listPublications() { return this.read<Publication[]>("/communication/publications") }
}
