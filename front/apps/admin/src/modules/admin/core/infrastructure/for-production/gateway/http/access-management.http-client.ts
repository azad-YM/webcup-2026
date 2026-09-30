import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AccessManagementError } from "../../../../application/errors/access-management.error"
import type { AccessSessionProvider } from "../../../../application/ports/provider/access-session.provider"

export class AccessManagementHttpClient extends ApiClient {
  constructor(baseUrl: string, private readonly session: AccessSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  protected async authorized<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (error instanceof AccessManagementError) throw error
      if (error instanceof ApiHttpError) {
        if (error.status === 401) {
          this.session.invalidate()
          throw new AccessManagementError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
        }
        if (error.status === 403) {
          throw new AccessManagementError("forbidden", "Vous n’avez pas les droits nécessaires pour cette opération.")
        }
        if (error.status === 422) {
          throw new AccessManagementError("invalid", "Le rôle a été refusé. Vérifiez son nom et les permissions sélectionnées, puis actualisez le catalogue si nécessaire.")
        }
      }
      throw new AccessManagementError("unavailable", "Le service est indisponible. Réessayez dans quelques instants.")
    }
  }
}
