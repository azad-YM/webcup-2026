import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { PilotageError } from "../../../../application/errors/pilotage.error"
import type { WebcupFeedGateway } from "../../../../application/ports/gateway/webcup-feed.gateway"
import type { PilotageSessionProvider } from "../../../../application/ports/provider/pilotage-session.provider"
import type { RequestTracking, TrackingInput, WebcupFeed } from "../../../../domain/webcup-feed"

export class WebcupFeedHttpGateway extends ApiClient implements WebcupFeedGateway {
  constructor(baseUrl: string, private readonly session: PilotageSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  async fetchFeed(): Promise<WebcupFeed> {
    try {
      return await this.getAuth<WebcupFeed>("/pilotage/webcup-feed")
    } catch (error) {
      throw this.translate(error)
    }
  }

  async updateTracking(requestCode: string, input: TrackingInput): Promise<RequestTracking> {
    try {
      return await this.putAuth<RequestTracking>(`/pilotage/tracking/${encodeURIComponent(requestCode)}`, input)
    } catch (error) {
      if (error instanceof ApiHttpError && error.status === 403) {
        throw new PilotageError("forbidden", "Seul un administrateur (permission admin.pilotage.write) peut modifier le suivi.")
      }
      if (error instanceof ApiHttpError && error.status === 422) {
        const message = (error.payload as { message?: unknown; error?: unknown } | undefined)
        const text = typeof message?.error === "string" ? message.error : typeof message?.message === "string" ? message.message : null
        throw new PilotageError("invalid", text ?? "Suivi refusé : vérifiez le statut, la note (500 caractères) et les liens (adresses http(s)).")
      }
      throw this.translate(error)
    }
  }

  private translate(error: unknown): PilotageError {
    if (error instanceof PilotageError) return error
    if (error instanceof ApiHttpError) {
      const code = (error.payload as { code?: unknown } | undefined)?.code
      if (error.status === 401) {
        this.session.invalidate()
        return new PilotageError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
      }
      if (error.status === 403) {
        return new PilotageError("forbidden", "Votre compte n’a pas accès au flux Nova Terra. Demandez à un administrateur le rôle « Agent municipal » (permission admin.pilotage.read).")
      }
      if (error.status === 503 || code === "webcup_api_key_missing") {
        return new PilotageError("key-missing", "Le flux n’est pas encore branché : la clé de l’API du concours n’est pas configurée sur le serveur (WEBCUP_API_KEY).")
      }
      if (code === "webcup_api_key_rejected") {
        return new PilotageError("key-rejected", "La clé configurée sur le serveur a été refusée par l’API du concours. Vérifiez WEBCUP_API_KEY.")
      }
      if (error.status === 502) {
        return new PilotageError("upstream-unavailable", "L’API du concours ne répond pas pour le moment. Le flux sera réessayé automatiquement.")
      }
    }
    return new PilotageError("unavailable", "Le service est indisponible. Réessayez dans quelques instants.")
  }
}
