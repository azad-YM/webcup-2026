import type { SafetyKitGateway } from "../../../../application/ports/gateway/safety-kit.gateway"
import type { CityAlert, SavedAlerts } from "../../../../domain/alert"

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">

export const DISTRICT_KEY = "nova-terra.safety.district"
export const SAVED_ALERTS_KEY = "nova-terra.safety.alerts"

/** Mémoire locale du kit de sécurité ; une mémoire indisponible (navigation privée) vaut pour la visite seulement. */
export class SafetyKitLocalStorageGateway implements SafetyKitGateway {
  constructor(private readonly storage: () => Storage | null = () => (typeof window === "undefined" ? null : window.localStorage)) {}

  async district(): Promise<string | null> {
    try {
      return this.storage()?.getItem(DISTRICT_KEY) || null
    } catch {
      return null
    }
  }

  async chooseDistrict(district: string | null): Promise<string | null> {
    try {
      if (district) this.storage()?.setItem(DISTRICT_KEY, district)
      else this.storage()?.removeItem(DISTRICT_KEY)
    } catch {
      /* Choix gardé pour cette visite seulement. */
    }
    return district
  }

  async savedAlerts(): Promise<SavedAlerts | null> {
    try {
      const value = JSON.parse(this.storage()?.getItem(SAVED_ALERTS_KEY) ?? "null") as SavedAlerts | null
      return value && Array.isArray(value.alerts) && typeof value.savedAt === "string" ? value : null
    } catch {
      return null
    }
  }

  async saveAlerts(alerts: CityAlert[], savedAt: string): Promise<SavedAlerts> {
    const saved = { alerts: alerts.slice(0, 30), savedAt }
    try {
      this.storage()?.setItem(SAVED_ALERTS_KEY, JSON.stringify(saved))
    } catch {
      /* Mémoire pleine : la copie précédente reste. */
    }
    return saved
  }
}
