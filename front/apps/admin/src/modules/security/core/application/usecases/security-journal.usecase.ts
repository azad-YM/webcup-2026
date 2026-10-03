import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { LoginSecurityJournal } from "../../domain/login-security-event"
export const listLoginSecurityEvents: UseCase<string, LoginSecurityJournal> = async (_dispatch, _getState, dependencies, search) =>
  dependencies.securityJournalGateway.listLoginEvents(search.trim())
