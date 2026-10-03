import type { ContentSessionProvider } from "@/modules/content/core/application/ports/provider/content-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"
export class AuthContentSessionProvider implements ContentSessionProvider {
 constructor(private readonly sessions: AuthSessionGateway, private readonly onInvalidated: () => void) {}
 async getToken() { const token = this.sessions.getToken(); if (!token) { this.invalidate(); throw new Error("Connectez-vous depuis le site.") } return token }
 invalidate() { this.sessions.clear(); this.onInvalidated() }
}
