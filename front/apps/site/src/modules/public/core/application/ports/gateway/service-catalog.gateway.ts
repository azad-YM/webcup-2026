import type { MunicipalService } from "../../../domain/municipal-service"

/**
 * Catalogue des services municipaux.
 * Adaptateur actuel : LOCAL (contenu de démonstration). L’adaptateur HTTP vers
 * Administration sera branché au lot L3.
 */
export interface ServiceCatalogGateway {
  listServices(): Promise<MunicipalService[]>
}
