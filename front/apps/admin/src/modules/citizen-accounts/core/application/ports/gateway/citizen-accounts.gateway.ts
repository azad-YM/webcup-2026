import type { CitizenAccounts, CitizenAccountsQuery } from "../../../domain/citizen-account"
export interface CitizenAccountsGateway {
  /** `GET /citizen/accounts?q=&reveal=1` — `reveal` : données sensibles, agent habilité, consultation journalisée (F70). */
  list(query: CitizenAccountsQuery): Promise<CitizenAccounts>
  setSuspension(input: { citizenId: string; suspended: boolean }): Promise<{ id: string; status: string }>
}
