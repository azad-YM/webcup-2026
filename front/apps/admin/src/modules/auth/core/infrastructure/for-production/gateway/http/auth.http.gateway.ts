import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { AuthGateway } from "../../../../application/ports/gateway/auth.gateway"
import type { AuthSessionGateway } from "../../../../application/ports/gateway/auth-session.gateway"
import type { AuthProfile, AuthSpace } from "../../../../application/dto/auth.dto"

type ProfileResponse = AuthProfile & { spaces: { code: string }[] }

export class AuthHttpGateway extends ApiClient implements AuthGateway {
  constructor(baseUrl: string, private readonly sessions: AuthSessionGateway, private readonly onInvalidated: () => void) { super(baseUrl) }

  async getProfile(): Promise<AuthProfile | null> {
    const token = this.sessions.getToken()
    if (!token) return null
    try {
      const profile = await this.get<ProfileResponse>("/iam/me", ApiClient.authHeaders(token))
      if (!profile.spaces.some(space => space.code === "admin")) throw new Error("Votre compte n’a pas accès à l’administration.")
      return { email: profile.email, name: profile.name }
    } catch (error) {
      if (error instanceof ApiHttpError && error.status === 401) {
        this.sessions.clear()
        this.onInvalidated()
        return null
      }
      if (error instanceof TypeError) throw new Error("Le service de connexion est indisponible. Réessayez.")
      throw error
    }
  }

  async listSpaces(): Promise<AuthSpace[]> {
    if (!await this.getProfile()) throw new Error("Connectez-vous depuis le site.")
    // Internal navigation, not the list of IAM portal destinations or operation permissions.
    return [
      { code: "admin", name: "Administration", description: "Rôles, membres et catalogue des permissions." },
      { code: "requests", name: "Demandes citoyennes", description: "Messages et signalements des habitants : file de traitement et suivi." },
      { code: "pilotage", name: "Pilotage", description: "Flux Nova Terra : demandes de la ville diffusées par l’API du concours." },
    ]
  }
}
