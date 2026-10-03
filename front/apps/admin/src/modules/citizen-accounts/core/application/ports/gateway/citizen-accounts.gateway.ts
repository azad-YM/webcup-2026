import type { CitizenAccounts } from "../../../domain/citizen-account"
export interface CitizenAccountsGateway {
  list(): Promise<CitizenAccounts>
  setSuspension(input: { citizenId: string; suspended: boolean }): Promise<{ id: string; status: string }>
}
