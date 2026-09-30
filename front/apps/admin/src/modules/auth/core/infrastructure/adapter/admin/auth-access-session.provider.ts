import type { AccessSessionProvider } from "@/modules/admin/core/application/ports/provider/access-session.provider"
import { AccessManagementError } from "@/modules/admin/core/application/errors/access-management.error"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

export class AuthAccessSessionProvider implements AccessSessionProvider {
  constructor(
    private readonly sessions: AuthSessionGateway,
    private readonly onInvalidated: () => void,
  ) {}

  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) {
      this.invalidate()
      throw new AccessManagementError("unauthenticated", "Connectez-vous depuis le site pour continuer.")
    }
    return token
  }

  invalidate(): void {
    this.sessions.clear()
    this.onInvalidated()
  }
}
