import type { CitizenSessionProvider } from "@/modules/citizen/core/application/ports/provider/citizen-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/**
 * Adaptateur fournisseur : le module auth fournit au module citizen le jeton
 * de la session en cours, sans exposer son stockage.
 */
export class AuthCitizenSessionAdapter implements CitizenSessionProvider {
  constructor(private readonly authSessionGateway: AuthSessionGateway) {}

  getToken(): string | null {
    try {
      return this.authSessionGateway.getToken()
    } catch {
      return null
    }
  }
}
