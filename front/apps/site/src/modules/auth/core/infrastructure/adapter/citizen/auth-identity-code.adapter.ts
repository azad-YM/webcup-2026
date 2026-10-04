import type { IdentityCodeProvider } from "@/modules/citizen/core/application/ports/provider/identity-code.provider"
import { AuthError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { AccountSecurityGateway } from "../../../application/ports/gateway/auth.gateway"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/** Adaptateur fournisseur (F55) : le module auth envoie au citoyen connecté un code de confirmation (IAM). */
export class AuthIdentityCodeAdapter implements IdentityCodeProvider {
  constructor(private readonly sessions: AuthSessionGateway, private readonly security: AccountSecurityGateway) {}

  sendCode() {
    const token = this.sessions.getToken()
    if (!token) return Promise.reject(new AuthError(401, "Votre session a expiré. Veuillez vous reconnecter."))
    return this.security.sendReconfirmationCode(token)
  }
}
