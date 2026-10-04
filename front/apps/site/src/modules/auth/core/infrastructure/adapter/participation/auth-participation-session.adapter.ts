import type { ParticipationSessionProvider } from "@/modules/participation/core/application/ports/provider/participation-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/** Adaptateur fournisseur : le module auth fournit au module participation le jeton de la session en cours. */
export class AuthParticipationSessionAdapter implements ParticipationSessionProvider {
  constructor(private readonly authSessionGateway: AuthSessionGateway) {}

  getToken(): string | null {
    try {
      return this.authSessionGateway.getToken()
    } catch {
      return null
    }
  }
}
