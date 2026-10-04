import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { AlertsGateway } from "../../../../application/ports/gateway/alerts.gateway"
import type { PublicSessionProvider } from "../../../../application/ports/provider/public-session.provider"
import type { AlertPreference, CitizenNotifications, CityAlert } from "../../../../domain/alert"

/**
 * Alertes (Communication) et préférences d’alerte (Citizen) :
 * `GET /communication/alerts` (public), `GET /communication/me/notifications`,
 * `GET|PUT /citizen/me/alert-preferences`.
 */
export class AlertsHttpGateway implements AlertsGateway {
  constructor(private readonly apiBaseUrl: string, private readonly session: PublicSessionProvider) {}

  private async request<T>(path: string, options: { authenticated: boolean; body?: unknown }): Promise<T> {
    const token = options.authenticated ? this.session.getToken() : null
    if (options.authenticated && !token) throw new AppError(401, "Connectez-vous pour retrouver vos notifications.")
    let response: Response
    try {
      response = await fetch(`${this.apiBaseUrl.replace(/\/$/, "")}${path}`, {
        method: options.body === undefined ? "GET" : "PUT",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" })
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
      })
    } catch {
      throw new AppError("NETWORK_ERROR", "Impossible de charger les alertes. Vérifiez votre connexion puis réessayez.")
    }
    if (response.status === 401) throw new AppError(401, "Votre session a expiré. Veuillez vous reconnecter.")
    if (response.status === 404) throw new AppError(404, "Les notifications sont réservées aux comptes citoyens.", { code: "NOT_CITIZEN" })
    if (!response.ok) throw new AppError(response.status, "Les alertes sont momentanément indisponibles. Réessayez dans quelques instants.")
    return (await response.json()) as T
  }

  listAlerts() {
    return this.request<CityAlert[]>("/communication/alerts", { authenticated: false })
  }

  listOfficialMessages() {
    return this.request<CityAlert[]>("/communication/official-messages", { authenticated: false })
  }

  myNotifications() {
    return this.request<CitizenNotifications>("/communication/me/notifications", { authenticated: true })
  }

  myPreference() {
    return this.request<AlertPreference>("/citizen/me/alert-preferences", { authenticated: true })
  }

  setHealthConsent(healthConsent: boolean) {
    return this.request<AlertPreference>("/citizen/me/alert-preferences", { authenticated: true, body: { healthConsent } })
  }
}
