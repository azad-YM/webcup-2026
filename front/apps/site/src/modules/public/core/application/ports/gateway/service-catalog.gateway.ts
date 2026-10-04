import type { MunicipalService } from "../../../domain/municipal-service"

/** Catalogue des services municipaux (BC Administration, `GET /administration/services`). */
export interface ServiceCatalogGateway {
  listServices(): Promise<MunicipalService[]>
}
