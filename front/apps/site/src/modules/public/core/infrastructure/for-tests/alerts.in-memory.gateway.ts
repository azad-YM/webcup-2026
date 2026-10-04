import type { AlertsGateway } from "../../application/ports/gateway/alerts.gateway"
import type { AlertPreference, CitizenNotifications, CityAlert } from "../../domain/alert"

/** Double : alertes et préférences en mémoire. */
export class InMemoryAlertsGateway implements AlertsGateway {
  constructor(
    public alerts: CityAlert[] = [],
    public notifications: CitizenNotifications = { alerts: [], announcements: [] },
    public preference: AlertPreference = { district: null, healthConsent: false }
  ) {}

  async listAlerts() {
    return this.alerts
  }

  async listDistricts() {
    return ["Nord", "Sud", "Est", "Ouest", "Centre", "Port"]
  }

  async listOfficialMessages() {
    return this.alerts.filter((alert) => alert.category === "official")
  }

  async myNotifications() {
    return this.notifications
  }

  async myPreference() {
    return this.preference
  }

  async setHealthConsent(healthConsent: boolean) {
    this.preference = { ...this.preference, healthConsent }
    return this.preference
  }
}
