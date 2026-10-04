import type { SavedAlerts, CityAlert } from "../../../domain/alert"

/**
 * F93, F101, F104 : ce que l’appareil garde pour la sécurité de la personne, sans compte :
 * son quartier (pour cibler les alertes) et la dernière copie des alertes et consignes, relue sans réseau.
 * Données non personnelles (aucun jeton, aucun identifiant), mémorisées dans ce navigateur seulement.
 */
export interface SafetyKitGateway {
  district(): Promise<string | null>
  /** Retourne le quartier enregistré (`null` = tous les quartiers). */
  chooseDistrict(district: string | null): Promise<string | null>
  savedAlerts(): Promise<SavedAlerts | null>
  saveAlerts(alerts: CityAlert[], savedAt: string): Promise<SavedAlerts>
}
