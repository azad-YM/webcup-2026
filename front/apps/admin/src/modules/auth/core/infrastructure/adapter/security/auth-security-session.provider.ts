import type { SecuritySessionProvider } from "@/modules/security/core/application/ports/provider/security-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"
export class AuthSecuritySessionProvider implements SecuritySessionProvider {
  constructor(private readonly sessions: AuthSessionGateway, private readonly onInvalidated: () => void) {}
  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) { this.invalidate(); throw new Error("Connectez-vous depuis le site pour continuer.") }
    return token
  }
  invalidate(): void { this.sessions.clear(); this.onInvalidated() }
}
