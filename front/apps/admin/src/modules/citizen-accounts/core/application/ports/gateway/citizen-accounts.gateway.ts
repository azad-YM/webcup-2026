import type { CitizenAccounts, WelcomedResident, WelcomeResidentInput } from "../../../domain/citizen-account"
export interface CitizenAccountsGateway {
  list(search: string): Promise<CitizenAccounts>
  setSuspension(input: { citizenId: string; suspended: boolean }): Promise<{ id: string; status: string }>
  /** F71 : compte créé à l’accueil de la mairie (identifiant d’habitant et code provisoire). */
  welcome(input: WelcomeResidentInput): Promise<WelcomedResident>
}
