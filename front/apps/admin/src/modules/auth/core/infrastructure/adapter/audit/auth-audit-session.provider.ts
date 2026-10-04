import type { AuditSessionProvider } from "@/modules/audit/core/application/ports/provider/audit-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

export class AuthAuditSessionProvider implements AuditSessionProvider {
  constructor(private readonly sessions: AuthSessionGateway, private readonly onInvalidated: () => void) {}

  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) {
      this.invalidate()
      throw new Error("Connectez-vous depuis le site pour continuer.")
    }
    return token
  }

  invalidate(): void {
    this.sessions.clear()
    this.onInvalidated()
  }
}
