import type { ContentGateway } from "../../application/ports/gateway/content.gateway"
import type { ContentSessionProvider } from "../../application/ports/provider/content-session.provider"
import type { MunicipalService, Publication } from "../../domain/content"
export class ContentHttpGateway implements ContentGateway {
 constructor(private readonly baseUrl: string, private readonly session: ContentSessionProvider) {}
 private async request<T>(path: string, value?: unknown): Promise<T> {
  const token = await this.session.getToken()
  let response: Response
  try { response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, { method: value === undefined ? "GET" : "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(value === undefined ? {} : { body: JSON.stringify(value) }) }) } catch { throw new Error("Connexion indisponible. Réessayez.") }
  if (response.status === 401) this.session.invalidate()
  if (!response.ok) { const data = await response.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(response.status === 403 ? "Vous n’avez pas la permission de gérer ces contenus." : data.message ?? data.error ?? "Enregistrement impossible.") }
  return response.json() as Promise<T>
 }
 services() { return this.request<MunicipalService[]>("/administration/services") }
 publications() { return this.request<Publication[]>("/communication/manage") }
 saveService(value: MunicipalService) { return this.request<void>("/administration/services", value) }
 savePublication(value: Publication) { return this.request<void>("/communication/publications", value) }
}
