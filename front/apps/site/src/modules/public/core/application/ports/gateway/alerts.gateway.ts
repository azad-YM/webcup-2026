import type { AlertPreference, CitizenNotifications, CityAlert } from "../../../domain/alert"

/**
 * Alertes et notifications (BC Communication) et préférences d’alerte (BC Citizen).
 * Erreurs : `AppError` (401 session expirée, 404 compte non citoyen, `NETWORK_ERROR`).
 */
export interface AlertsGateway {
  /**
   * Alertes publiques pendant leur validité (tous les habitants et alertes de quartier, F101),
   * plus celles qui commencent dans les 12 h (`status: "upcoming"`).
   */
  listAlerts(): Promise<CityAlert[]>
  /** Liste fermée des quartiers (Administration). */
  listDistricts(): Promise<string[]>
  /** F73 : archive publique des messages officiels du Haut Conseil, du plus récent au plus ancien. */
  listOfficialMessages(): Promise<CityAlert[]>
  /** Alertes qui concernent le citoyen connecté et annonces importantes. */
  myNotifications(): Promise<CitizenNotifications>
  myPreference(): Promise<AlertPreference>
  setHealthConsent(healthConsent: boolean): Promise<AlertPreference>
}
