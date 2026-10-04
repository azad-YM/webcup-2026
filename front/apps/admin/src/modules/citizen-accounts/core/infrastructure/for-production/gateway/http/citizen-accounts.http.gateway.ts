import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { CitizenAccountsGateway } from "../../../../application/ports/gateway/citizen-accounts.gateway"
import type { AccountSessionProvider } from "../../../../application/ports/provider/account-session.provider"
import type { CitizenAccounts, WelcomedResident, WelcomeResidentInput } from "../../../../domain/citizen-account"
export class CitizenAccountsHttpGateway extends ApiClient implements CitizenAccountsGateway {
  constructor(baseUrl: string, private readonly session: AccountSessionProvider) { super(baseUrl, () => session.getToken()) }
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try { return await request() } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) { this.session.invalidate(); throw new Error("Votre session a expiré. Reconnectez-vous depuis le site.") }
        if (error.status === 403) throw new Error("Vous n’avez pas la permission de gérer les comptes citoyens.")
        if (error.status === 409 && error.message.includes("email")) throw new Error("Cette adresse e-mail a déjà un compte. Laissez le champ vide ou vérifiez l’adresse.")
        if (error.status === 422 || error.status === 400) throw new Error("Vérifiez les informations saisies : prénom, nom, langue et, s’il est donné, un e-mail valide.")
        if (error.status === 409) throw new Error("Ce compte est protégé par un accès d’agent actif, ou a été supprimé. Actualisez la liste.")
        if (error.status === 404) throw new Error("Ce compte est introuvable. Actualisez la liste.")
        throw new Error("L’opération a été refusée. Réessayez dans quelques instants.")
      }
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion puis réessayez.")
    }
  }
  list(search: string): Promise<CitizenAccounts> {
    const query = search ? `?${new URLSearchParams({ q: search }).toString()}` : ""
    return this.execute(() => this.getAuth<CitizenAccounts>(`/citizen/accounts${query}`))
  }
  setSuspension(input: { citizenId: string; suspended: boolean }): Promise<{ id: string; status: string }> {
    return this.execute(() => this.putAuth<{ id: string; status: string }>("/citizen/accounts/suspension", input))
  }
  welcome(input: WelcomeResidentInput): Promise<WelcomedResident> {
    return this.execute(() => this.postAuth<WelcomedResident>("/citizen/accounts/welcome", input))
  }
}
