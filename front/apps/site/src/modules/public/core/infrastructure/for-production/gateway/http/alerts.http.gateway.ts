import { BrowserRealtimeSubscriber, type RealtimeOptions } from "@boilerplate/shared-utils/realtime"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { PublicSessionProvider } from "../../../../application/ports/provider/public-session.provider"
import type { AlertsGateway } from "../../../../application/ports/gateway/alerts.gateway"
import type { CityNotice, AlertPreference } from "../../../../domain/alert"
export class AlertsHttpGateway implements AlertsGateway {
 private readonly realtime: BrowserRealtimeSubscriber
 constructor(private readonly baseUrl: string, private readonly session: PublicSessionProvider, options: RealtimeOptions) { this.realtime = new BrowserRealtimeSubscriber(options) }
 private async request<T>(path: string, authenticated: boolean, body?: unknown): Promise<T> {
  const token = authenticated ? this.session.getToken() : null
  if (authenticated && !token) throw new AppError(401, "Connectez-vous pour retrouver vos notifications.")
  let response: Response
  try { response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, { method: body === undefined ? "GET" : "PUT", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) } catch { throw new AppError("NETWORK_ERROR", "Impossible de charger les alertes. Réessayez.") }
  if (!response.ok) throw new AppError(response.status, response.status === 404 ? "Activez votre espace citoyen pour recevoir les notifications." : "Impossible de charger les alertes.")
  return response.json() as Promise<T>
 }
 alerts() { return this.request<CityNotice[]>("/communication/alerts", false) }
 notifications() { return this.request<CityNotice[]>("/communication/notifications", true) }
 preferences() { return this.request<AlertPreference>("/citizen/me/alert-preferences", true) }
 setConsent(healthConsent: boolean) { return this.request<void>("/citizen/me/alert-preferences", true, { healthConsent }) }
 subscribe(onChange: () => void) { return this.realtime.subscribe("public.alerts", onChange) }
}
