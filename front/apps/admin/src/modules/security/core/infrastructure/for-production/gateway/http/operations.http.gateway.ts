import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { OperationsGateway } from "../../../../application/ports/gateway/operations.gateway"
import type { SecuritySessionProvider } from "../../../../application/ports/provider/security-session.provider"
import type { Anomaly, AnomalyBoard, AnomalyFilters, AnomalyStatus, AnomalySummary, BackupBoard, PlatformStatus, ScanResult, SecurityEventFeed } from "../../../../domain/operations"

/** `GET/POST/PUT /api/audit/anomalies…` (F85), `GET /api/platform/backups` (F87), `GET /api/platform/status` (F77). */
export class OperationsHttpGateway extends ApiClient implements OperationsGateway {
  constructor(baseUrl: string, private readonly session: SecuritySessionProvider) { super(baseUrl, () => session.getToken()) }

  private async run<T>(request: () => Promise<T>, forbidden: string): Promise<T> {
    try { return await request() } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) { this.session.invalidate(); throw new Error("Votre session a expiré. Reconnectez-vous depuis le site.") }
        if (error.status === 403) throw new Error(forbidden)
        if (error.status === 503) throw new Error(error.message || "Fonction suspendue pendant le mode allégé. Réessayez dans quelques minutes.")
        throw new Error("Le service est momentanément indisponible. Réessayez dans quelques instants.")
      }
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion puis réessayez.")
    }
  }

  anomalies(filters: AnomalyFilters): Promise<AnomalyBoard> {
    const params = new URLSearchParams()
    if (filters.status) params.set("status", filters.status)
    if (filters.severity) params.set("severity", filters.severity)
    const query = params.toString()
    return this.run(() => this.getAuth<AnomalyBoard>(`/audit/anomalies${query ? `?${query}` : ""}`), "Vous n’avez pas la permission de consulter l’activité inhabituelle (admin.security.read).")
  }

  scan(): Promise<ScanResult> {
    return this.run(() => this.postAuth<ScanResult>("/audit/anomalies/scan", {}), "Vous n’avez pas la permission de lancer une analyse.")
  }

  changeStatus(id: string, status: AnomalyStatus): Promise<Anomaly> {
    return this.run(() => this.putAuth<Anomaly>("/audit/anomalies/status", { id, status }), "Vous n’avez pas la permission de suivre les anomalies.")
  }

  summary(): Promise<AnomalySummary> {
    return this.run(() => this.getAuth<AnomalySummary>("/audit/anomalies/summary"), "Vous n’avez pas la permission de consulter ce résumé.")
  }

  backups(): Promise<BackupBoard> {
    return this.run(() => this.getAuth<BackupBoard>("/platform/backups"), "Les rapports de sauvegarde sont réservés à l’administrateur principal (admin.backup.read).")
  }

  platformStatus(): Promise<PlatformStatus> {
    return this.run(() => this.get<PlatformStatus>("/platform/status"), "État de la plateforme indisponible.")
  }

  securityEvents(limit: number): Promise<SecurityEventFeed> {
    return this.run(() => this.getAuth<SecurityEventFeed>(`/audit/security-events?limit=${limit}`), "Les événements de sécurité sont réservés aux membres de l’administration.")
  }
}
