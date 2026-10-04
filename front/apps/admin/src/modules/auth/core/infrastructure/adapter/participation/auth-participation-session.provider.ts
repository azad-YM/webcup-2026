import type { ParticipationSessionProvider } from "@/modules/participation/core/application/ports/provider/participation-session.provider"
import { ParticipationError } from "@/modules/participation/core/application/errors/participation.error"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/** Adaptateur fournisseur : le module auth fournit la session de l’agent au module participation. */
export class AuthParticipationSessionProvider implements ParticipationSessionProvider {
  constructor(private readonly sessions: AuthSessionGateway, private readonly onInvalidated: () => void) {}

  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) {
      this.invalidate()
      throw new ParticipationError("unauthenticated", "Connectez-vous depuis le site pour continuer.")
    }
    return token
  }

  invalidate(): void {
    this.sessions.clear()
    this.onInvalidated()
  }
}
