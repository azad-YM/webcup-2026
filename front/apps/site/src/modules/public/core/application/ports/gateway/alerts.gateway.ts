import type { AlertPreference, CitizenNotifications, CityAlert } from "../../../domain/alert"

/**
 * Alertes et notifications (BC Communication) et préférences d’alerte (BC Citizen).
 * Erreurs : `AppError` (401 session expirée, 404 compte non citoyen, `NETWORK_ERROR`).
 */
export interface AlertsGateway {
  /** Alertes adressées à tous les habitants, pendant leur validité (public). */
  listAlerts(): Promise<CityAlert[]>
  /** F73 : archive publique des messages officiels du Haut Conseil, du plus récent au plus ancien. */
  listOfficialMessages(): Promise<CityAlert[]>
  /** Alertes qui concernent le citoyen connecté et annonces importantes. */
  myNotifications(): Promise<CitizenNotifications>
  myPreference(): Promise<AlertPreference>
  setHealthConsent(healthConsent: boolean): Promise<AlertPreference>
}
