import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { ContentError } from "../../../../application/errors/content.error"
import type { ContentGateway } from "../../../../application/ports/gateway/content.gateway"
import type { ContentSessionProvider } from "../../../../application/ports/provider/content-session.provider"
import type { Alert, MunicipalService, TransportLine, PlainLanguageDraft, Publication, PublicationPlainLanguageRequest, ServiceAvailabilityChange, ServicePlainLanguageRequest } from "../../../../domain/content"

/** Adaptateur HTTP des contenus : services (Administration), publications et alertes (Communication). */
export class ContentHttpGateway extends ApiClient implements ContentGateway {
  constructor(baseUrl: string, private readonly session: ContentSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  listServices() {
    return this.call(() => this.getAuth<MunicipalService[]>("/administration/services"), "les services")
  }

  saveService(service: MunicipalService) {
    return this.call(() => this.putAuth<MunicipalService>("/administration/services", service), "le service", "admin.service.write")
  }

  setServiceAvailability(change: ServiceAvailabilityChange) {
    return this.call(
      () => this.postAuth<MunicipalService>("/administration/services/availability", change),
      change.disabled ? "désactiver le service" : "réactiver le service",
      "admin.service.disable"
    )
  }

  listDistricts() {
    return this.call(() => this.getAuth<string[]>("/administration/districts"), "les quartiers")
  }

  listPublications() {
    return this.call(() => this.getAuth<Publication[]>("/communication/manage/publications"), "les publications", "admin.communication.write")
  }

  savePublication(publication: Publication) {
    return this.call(() => this.putAuth<Publication>("/communication/manage/publications", publication), "la publication", "admin.communication.write")
  }

  listAlerts() {
    return this.call(() => this.getAuth<Alert[]>("/communication/manage/alerts"), "les alertes", "admin.communication.write")
  }

  saveAlert(alert: Alert) {
    return this.call(() => this.putAuth<Alert>("/communication/manage/alerts", alert), "l’alerte", "admin.communication.write")
  }

  suggestServicePlainLanguage(request: ServicePlainLanguageRequest) {
    return this.call(() => this.postAuth<PlainLanguageDraft>("/administration/services/plain-language", request), "la proposition de version en clair", "admin.service.write")
  }

  suggestPublicationPlainLanguage(request: PublicationPlainLanguageRequest) {
    return this.call(() => this.postAuth<PlainLanguageDraft>("/communication/manage/publications/plain-language", request), "la proposition de version en clair", "admin.communication.write")
  }

  listTransportLines() {
    return this.call(() => this.getAuth<TransportLine[]>("/administration/transport-lines"), "les lignes de transport")
  }

  saveTransportLine(line: TransportLine) {
    return this.call(() => this.putAuth<TransportLine>("/administration/transport-lines", line), "la ligne de transport", "admin.service.write")
  }

  private async call<T>(request: () => Promise<T>, what: string, permission?: string): Promise<T> {
    try {
      return await request()
    } catch (error) {
      throw this.translate(error, what, permission)
    }
  }

  private translate(error: unknown, what: string, permission?: string): ContentError {
    if (error instanceof ContentError) return error
    if (!(error instanceof ApiHttpError)) {
      return new ContentError("unavailable", `Impossible de joindre le serveur pour ${what}. Vérifiez votre connexion puis réessayez.`)
    }
    switch (error.status) {
      case 401:
        this.session.invalidate()
        return new ContentError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
      case 403:
        return new ContentError("forbidden", `Votre compte ne peut pas gérer ${what}${permission ? ` (permission ${permission})` : ""}. Demandez le rôle « Agent municipal » à un administrateur.`)
      case 404:
        return new ContentError("not-found", `Impossible de retrouver ${what} : la liste a peut-être changé. Rechargez la page.`)
      case 400:
        // Règle métier refusée : le message de l’API est rédigé en français pour l’agent.
        return new ContentError("invalid", error.payload?.message ?? error.payload?.error ?? `${what} : saisie refusée.`)
      case 429:
        return new ContentError("unavailable", error.payload?.message ?? error.payload?.error ?? "Trop de demandes en peu de temps. Patientez une minute.")
      case 422:
        return new ContentError("invalid", `Certains champs obligatoires sont vides ou trop longs pour ${what}. Vérifiez la saisie.`)
      default:
        return new ContentError("unavailable", `Le serveur n’a pas pu traiter ${what}. Réessayez dans quelques instants.`)
    }
  }
}
