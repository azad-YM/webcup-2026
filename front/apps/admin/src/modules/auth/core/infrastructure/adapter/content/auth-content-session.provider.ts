import type { ContentSessionProvider } from "@/modules/content/core/application/ports/provider/content-session.provider"
import { ContentError } from "@/modules/content/core/application/errors/content.error"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/** Adaptateur fournisseur : le module auth fournit la session de l’agent au module content. */
export class AuthContentSessionProvider implements ContentSessionProvider {
  constructor(private readonly sessions: AuthSessionGateway, private readonly onInvalidated: () => void) {}

  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) {
      this.invalidate()
      throw new ContentError("unauthenticated", "Connectez-vous depuis le site pour continuer.")
    }
    return token
  }

  invalidate(): void {
    this.sessions.clear()
    this.onInvalidated()
  }
}
