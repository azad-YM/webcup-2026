import type { Alert, MunicipalService, Publication } from "../../../domain/content"

/**
 * Gestion des contenus par les agents. Erreurs : `ContentError`.
 * - Administration : `GET|PUT /administration/services`, `GET /administration/districts` (permission `admin.service.write` pour écrire) ;
 * - Communication : `GET|PUT /communication/manage/publications`, `GET|PUT /communication/manage/alerts` (permission `admin.communication.write`).
 */
export interface ContentGateway {
  listServices(): Promise<MunicipalService[]>
  saveService(service: MunicipalService): Promise<MunicipalService>
  listDistricts(): Promise<string[]>
  listPublications(): Promise<Publication[]>
  savePublication(publication: Publication): Promise<Publication>
  listAlerts(): Promise<Alert[]>
  saveAlert(alert: Alert): Promise<Alert>
}
