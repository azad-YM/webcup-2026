/** L24, L25 (ADR 012) : activité inhabituelle (F85), sauvegardes (F87) et état de la plateforme (F77). */

export type AnomalySeverity = "info" | "warning" | "critical"
export type AnomalyStatus = "new" | "seen" | "handled"

export type Anomaly = {
  id: string
  rule: string
  ruleLabel: string
  category: "security" | "integrity" | "abuse" | string
  severity: AnomalySeverity
  title: string
  explanation: string
  related: { type: string; id: string; label: string }[]
  status: AnomalyStatus
  occurrences: number
  reaction: string | null
  handledBy: string | null
  handledAt: string | null
  detectedAt: string
  lastSeenAt: string
}

export type AnomalyBoard = {
  items: Anomaly[]
  counters: { new: number; seen: number; handled: number; criticalOpen: number }
  signals: { formRejected: number; formChallenged: number; rateLimited: number }
  rules: Record<string, string>
  lastScanAt: string | null
}

export type AnomalyFilters = { status: AnomalyStatus | null; severity: AnomalySeverity | null }
export type AnomalySummary = { text: string; source: "ai" | "rules"; generatedAt: string; count: number }
export type ScanResult = { detected: number; created: number; critical: number; reactions: number; scannedAt: string }

export const SEVERITY_LABELS: Record<AnomalySeverity, string> = { info: "Information", warning: "À surveiller", critical: "Grave" }
export const STATUS_LABELS: Record<AnomalyStatus, string> = { new: "Nouvelle", seen: "Vue", handled: "Traitée" }
export const CATEGORY_LABELS: Record<string, string> = { security: "Sécurité", integrity: "Données incohérentes", abuse: "Envois abusifs" }

/** Événement temps réel (topic `administration.security`) d'une nouvelle anomalie grave. */
export const SECURITY_EVENTS = ["security.anomaly_detected"] as const
export const ANOMALY_POLLING_MS = 120_000

export type BackupVerdict = "ok" | "warning" | "failed"
export type BackupReport = {
  id: string
  type: "run" | "verify"
  backupId: string | null
  startedAt: string
  finishedAt: string
  durationMs: number
  verdict: BackupVerdict
  summary: string
  totals: { tables: number; rows: number; bytes: number }
  tables: { name: string; bc: string; rows: number; bytes: number; status: string; notes: string }[]
  issues: string[]
  restoreMode: "temporary_tables" | "reread_only" | null
}
export type BackupBoard = {
  reports: BackupReport[]
  lastRun: BackupReport | null
  lastVerify: BackupReport | null
  storage: { backups: number; bytes: number; retention: number }
}
export const VERDICT_LABELS: Record<BackupVerdict, string> = { ok: "OK", warning: "À surveiller", failed: "Échec" }

export type PlatformStatus = {
  mode: "normal" | "degraded"
  source: "env" | "manual" | "auto" | null
  since: string | null
  until: string | null
  reason: string
  message: string
  essential: string[]
  suspended: string[]
}
export const PLATFORM_SOURCE_LABELS: Record<string, string> = { env: "configuration du serveur", manual: "équipe technique", auto: "détection automatique de surcharge" }

export function humanBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`
  if (bytes >= 1024) return `${(bytes / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ko`
  return `${bytes} octets`
}
