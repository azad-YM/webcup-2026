import type { Anomaly, AnomalyBoard, AnomalyFilters, AnomalyStatus, AnomalySummary, BackupBoard, PlatformStatus, ScanResult, SecurityEventFeed } from "../../../domain/operations"

/** Activité inhabituelle (Audit), sauvegardes et état de la plateforme (Shared). */
export interface OperationsGateway {
  anomalies(filters: AnomalyFilters): Promise<AnomalyBoard>
  scan(): Promise<ScanResult>
  changeStatus(id: string, status: AnomalyStatus): Promise<Anomaly>
  summary(): Promise<AnomalySummary>
  backups(): Promise<BackupBoard>
  platformStatus(): Promise<PlatformStatus>
  /** F100 : `GET /api/audit/security-events`. */
  securityEvents(limit: number): Promise<SecurityEventFeed>
}
