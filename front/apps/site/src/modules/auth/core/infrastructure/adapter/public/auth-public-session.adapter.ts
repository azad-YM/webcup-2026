import type { PublicSessionProvider } from "@/modules/public/core/application/ports/provider/public-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"
export class AuthPublicSessionAdapter implements PublicSessionProvider {
 constructor(private readonly sessions: AuthSessionGateway) {}
 getToken() { try { return this.sessions.getToken() } catch { return null } }
}
