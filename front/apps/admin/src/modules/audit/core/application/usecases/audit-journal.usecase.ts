import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { AuditFilters, AuditJournal } from "../../domain/audit-entry"

export const listAuditEntries: UseCase<AuditFilters, AuditJournal> = async (_dispatch, _getState, dependencies, filters) =>
  dependencies.auditJournalGateway.listEntries(filters)
