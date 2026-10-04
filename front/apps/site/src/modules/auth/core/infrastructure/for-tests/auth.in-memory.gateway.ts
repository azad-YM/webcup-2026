import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { AuthGateway } from "../../application/ports/gateway/auth.gateway"
import type { AuthSessionGateway } from "../../application/ports/gateway/auth-session.gateway"
import type { AuthSpace, LoginPayload } from "../../application/dto/auth.dto"

/** Double d’IAM : délivre des jetons `token:<email>` aux comptes connus. */
export class InMemoryAuthGateway implements AuthGateway {
  readonly accounts = new Map<string, string>()
  readonly logins: LoginPayload[] = []
  spaces: AuthSpace[] = []
  failNextLoginWith: AppError | null = null

  async loginWithCredentials(payload: LoginPayload) {
    this.logins.push(payload)
    const failure = this.failNextLoginWith
    this.failNextLoginWith = null
    if (failure) throw failure
    if (this.accounts.get(payload.email) !== payload.password) {
      throw new AppError(401, "Adresse e-mail, mot de passe incorrect ou session expirée.")
    }
    return { token: `token:${payload.email}` }
  }

  async listSpaces() {
    return this.spaces
  }

  async issuePortalCode() {
    return { code: "code" }
  }

  // L15 : non simulé par ce double (aucun test écrit pour la connexion renforcée).
  async requestLoginLink(): Promise<never> { throw new AppError("CLIENT_ERROR", "Not configured") }
  async consumeLoginLink(): Promise<never> { throw new AppError("CLIENT_ERROR", "Not configured") }
  async verifySignInCode(): Promise<never> { throw new AppError("CLIENT_ERROR", "Not configured") }
  async resendSignInCode(): Promise<never> { throw new AppError("CLIENT_ERROR", "Not configured") }
}

export class InMemoryAuthSessionGateway implements AuthSessionGateway {
  private token: string | null = null
  getToken() { return this.token }
  saveToken(token: string) { this.token = token }
  clear() { this.token = null }
}
