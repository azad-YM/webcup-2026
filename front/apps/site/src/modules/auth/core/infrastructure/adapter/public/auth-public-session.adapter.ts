import type { PublicSessionProvider } from "@/modules/public/core/application/ports/provider/public-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/**
 * Adaptateur fournisseur : le module auth fournit au module public le jeton de la session
 * en cours (notifications, préférences d’alerte, ticket du flux temps réel), sans exposer son stockage.
 */
export class AuthPublicSessionAdapter implements PublicSessionProvider {
  constructor(private readonly authSessionGateway: AuthSessionGateway) {}

  getToken(): string | null {
    try {
      return this.authSessionGateway.getToken()
    } catch {
      return null
    }
  }
}
