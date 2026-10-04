import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { CitizenWorkspaceUnavailableError, type CitizenWorkspaceProvider } from "@/modules/auth/core/application/ports/provider/citizen-workspace.provider"
import type { AccountSessionProvider } from "../../../application/ports/provider/account-session.provider"

/** Traduit le contrat HTTP Citizen en capacité de navigation pour Auth, sans exposer le profil. */
export class HttpCitizenWorkspaceProvider extends ApiClient implements CitizenWorkspaceProvider {
  constructor(baseUrl: string, private readonly session: AccountSessionProvider) {
    super(baseUrl, () => session.getToken())
  }
  async isAvailable(): Promise<boolean> {
    try {
      await this.getAuth<unknown>("/citizen/me")
      return true
    } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 404) return false
        if (error.status === 401) this.session.invalidate()
      }
      throw new CitizenWorkspaceUnavailableError()
    }
  }
}
