import type { RequestSessionProvider } from "@/modules/requests/core/application/ports/provider/request-session.provider"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"
export class AuthRequestSessionProvider implements RequestSessionProvider {
 constructor(private readonly sessions: AuthSessionGateway, private readonly onInvalidated: () => void) {}
 async getToken(): Promise<string> { const token=this.sessions.getToken(); if(!token){this.invalidate();throw new Error("Connectez-vous depuis le site.")}return token }
 invalidate(): void {this.sessions.clear();this.onInvalidated()}
}
