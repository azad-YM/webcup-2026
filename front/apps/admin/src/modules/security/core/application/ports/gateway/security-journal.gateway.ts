import type { LoginSecurityJournal } from "../../../domain/login-security-event"
export interface SecurityJournalGateway {
  listLoginEvents(search: string): Promise<LoginSecurityJournal>
}
