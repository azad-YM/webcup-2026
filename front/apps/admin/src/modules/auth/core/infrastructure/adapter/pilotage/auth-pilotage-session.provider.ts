import type { PilotageSessionProvider } from "@/modules/pilotage/core/application/ports/provider/pilotage-session.provider"
import { PilotageError } from "@/modules/pilotage/core/application/errors/pilotage.error"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/** Session adapter of the `auth` module for the port owned by the `pilotage` module. */
export class AuthPilotageSessionProvider implements PilotageSessionProvider {
  constructor(
    private readonly sessions: AuthSessionGateway,
    private readonly onInvalidated: () => void,
  ) {}

  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) {
      this.invalidate()
      throw new PilotageError("unauthenticated", "Connectez-vous depuis le site pour continuer.")
    }
    return token
  }

  invalidate(): void {
    this.sessions.clear()
    this.onInvalidated()
  }
}
