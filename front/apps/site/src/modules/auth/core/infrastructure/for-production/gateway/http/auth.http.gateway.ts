import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { AuthGateway } from "../../../../application/ports/gateway/auth.gateway"
import type { AuthSpace, AuthToken, LoginPayload } from "../../../../application/dto/auth.dto"
import { AuthError } from "@/modules/shared/core/lib/use-cases.decorator"

export class AuthHttpGateway extends ApiClient implements AuthGateway {
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try { return await request() } catch (error) {
      if (error instanceof ApiHttpError) {
        throw new AuthError(error.status, error.status === 401
          ? "Adresse e-mail, mot de passe incorrect ou session expirée."
          : error.status === 403 ? "Vous n’avez pas accès à cet espace." : "Le service est indisponible. Réessayez.")
      }
      throw new AuthError("NETWORK_ERROR", "Impossible de joindre le service. Réessayez.")
    }
  }
  loginWithCredentials(payload: LoginPayload): Promise<AuthToken> {
    return this.execute(() => this.post<AuthToken>("/login_check", payload))
  }
  listSpaces(token: string): Promise<AuthSpace[]> {
    return this.execute(() => this.get<AuthSpace[]>("/iam/me/spaces", ApiClient.authHeaders(token)))
  }
  issuePortalCode(token: string, challenge: string): Promise<{ code: string }> {
    return this.execute(() => this.post<{ code: string }>("/iam/portal-codes", { destination: "admin", challenge }, ApiClient.authHeaders(token)))
  }
}
