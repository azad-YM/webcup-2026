import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { CitizenAccountsGateway } from "../../../../application/ports/gateway/citizen-accounts.gateway"
import type { AccountSessionProvider } from "../../../../application/ports/provider/account-session.provider"
import type { CitizenAccounts, CitizenAccountsQuery } from "../../../../domain/citizen-account"
export class CitizenAccountsHttpGateway extends ApiClient implements CitizenAccountsGateway {
  constructor(baseUrl: string, private readonly session: AccountSessionProvider) { super(baseUrl, () => session.getToken()) }
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try { return await request() } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) { this.session.invalidate(); throw new Error("Votre session a expiré. Reconnectez-vous depuis le site.") }
        if (error.status === 403) throw new Error("Vous n’avez pas la permission de gérer les comptes citoyens.")
        if (error.status === 409) throw new Error("Ce compte est protégé par un accès d’agent actif, ou a été supprimé. Actualisez la liste.")
        if (error.status === 404) throw new Error("Ce compte est introuvable. Actualisez la liste.")
        throw new Error("L’opération a été refusée. Réessayez dans quelques instants.")
      }
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion puis réessayez.")
    }
  }
  list({ search, reveal }: CitizenAccountsQuery): Promise<CitizenAccounts> {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (reveal) params.set("reveal", "1")
    const query = params.size > 0 ? `?${params.toString()}` : ""
    return this.execute(() => this.getAuth<CitizenAccounts>(`/citizen/accounts${query}`))
  }
  setSuspension(input: { citizenId: string; suspended: boolean }): Promise<{ id: string; status: string }> {
    return this.execute(() => this.putAuth<{ id: string; status: string }>("/citizen/accounts/suspension", input))
  }
}
