import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { SecurityJournalGateway } from "../../../../application/ports/gateway/security-journal.gateway"
import type { SecuritySessionProvider } from "../../../../application/ports/provider/security-session.provider"
import type { LoginSecurityJournal } from "../../../../domain/login-security-event"
export class SecurityJournalHttpGateway extends ApiClient implements SecurityJournalGateway {
  constructor(baseUrl: string, private readonly session: SecuritySessionProvider) { super(baseUrl, () => session.getToken()) }
  async listLoginEvents(search: string): Promise<LoginSecurityJournal> {
    const query = search ? `?${new URLSearchParams({ q: search }).toString()}` : ""
    try { return await this.getAuth<LoginSecurityJournal>(`/iam/security/login-events${query}`) } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) { this.session.invalidate(); throw new Error("Votre session a expiré. Reconnectez-vous depuis le site.") }
        if (error.status === 403) throw new Error("Vous n’avez pas la permission de consulter le journal de sécurité.")
        throw new Error("Le journal est momentanément indisponible. Réessayez dans quelques instants.")
      }
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion puis réessayez.")
    }
  }
}
