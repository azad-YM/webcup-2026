import type { RequestSessionProvider } from "@/modules/requests/core/application/ports/provider/request-session.provider"
import { RequestsError } from "@/modules/requests/core/application/errors/requests.error"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/** Session adapter of the `auth` module for the port owned by the `requests` module. */
export class AuthRequestSessionProvider implements RequestSessionProvider {
  constructor(
    private readonly sessions: AuthSessionGateway,
    private readonly onInvalidated: () => void,
  ) {}

  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) {
      this.invalidate()
      throw new RequestsError("unauthenticated", "Connectez-vous depuis le site pour continuer.")
    }
    return token
  }

  invalidate(): void {
    this.sessions.clear()
    this.onInvalidated()
  }
}
