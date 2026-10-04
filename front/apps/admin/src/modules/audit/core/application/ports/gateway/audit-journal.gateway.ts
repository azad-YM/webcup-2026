import type { AuditFilters, AuditJournal } from "../../../domain/audit-entry"

export interface AuditJournalGateway {
  listEntries(filters: AuditFilters): Promise<AuditJournal>
}
