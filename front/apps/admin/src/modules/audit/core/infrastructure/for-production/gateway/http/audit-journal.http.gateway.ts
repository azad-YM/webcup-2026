import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { AuditJournalGateway } from "../../../../application/ports/gateway/audit-journal.gateway"
import type { AuditSessionProvider } from "../../../../application/ports/provider/audit-session.provider"
import { auditQuery, type AuditFilters, type AuditJournal } from "../../../../domain/audit-entry"

export class AuditJournalHttpGateway extends ApiClient implements AuditJournalGateway {
  constructor(baseUrl: string, private readonly session: AuditSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  async listEntries(filters: AuditFilters): Promise<AuditJournal> {
    try {
      return await this.getAuth<AuditJournal>(`/audit/entries${auditQuery(filters)}`)
    } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) {
          this.session.invalidate()
          throw new Error("Votre session a expiré. Reconnectez-vous depuis le site.")
        }
        if (error.status === 403) throw new Error("Vous n’avez pas la permission de consulter le journal des actions (admin.audit.read).")
        if (error.status === 422) throw new Error("Filtres invalides : vérifiez les dates.")
        throw new Error("Le journal est momentanément indisponible. Réessayez dans quelques instants.")
      }
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion puis réessayez.")
    }
  }
}
