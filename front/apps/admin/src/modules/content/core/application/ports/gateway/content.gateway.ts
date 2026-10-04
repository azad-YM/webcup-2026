import type { Alert, MunicipalService, TransportLine, PlainLanguageDraft, Publication, PublicationPlainLanguageRequest, ServiceAvailabilityChange, ServicePlainLanguageRequest } from "../../../domain/content"

/**
 * Gestion des contenus par les agents. Erreurs : `ContentError`.
 * - Administration : `GET|PUT /administration/services`, `GET /administration/districts` (permission `admin.service.write` pour écrire),
 *   `POST /administration/services/availability` (permission `admin.service.disable`, F63) ;
 * - Communication : `GET|PUT /communication/manage/publications`, `GET|PUT /communication/manage/alerts` (permission `admin.communication.write`).
 */
export interface ContentGateway {
  listServices(): Promise<MunicipalService[]>
  saveService(service: MunicipalService): Promise<MunicipalService>
  setServiceAvailability(change: ServiceAvailabilityChange): Promise<MunicipalService>
  listDistricts(): Promise<string[]>
  listPublications(): Promise<Publication[]>
  savePublication(publication: Publication): Promise<Publication>
  listAlerts(): Promise<Alert[]>
  saveAlert(alert: Alert): Promise<Alert>
  /** F89 : `POST /administration/services/plain-language` et `POST /communication/manage/publications/plain-language`. */
  suggestServicePlainLanguage(request: ServicePlainLanguageRequest): Promise<PlainLanguageDraft>
  suggestPublicationPlainLanguage(request: PublicationPlainLanguageRequest): Promise<PlainLanguageDraft>
  /** F97 : `GET|PUT /administration/transport-lines` (écriture : `admin.service.write`). */
  listTransportLines(): Promise<TransportLine[]>
  saveTransportLine(line: TransportLine): Promise<TransportLine>
}
