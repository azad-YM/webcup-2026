import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AuthError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { AccountAccessStatus, ResidentAccessGateway } from "../../../../application/ports/gateway/resident-access.gateway"

/** Accès des habitants accueillis à la mairie (F71), sur les routes IAM. */
export class ResidentAccessHttpGateway extends ApiClient implements ResidentAccessGateway {
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try { return await request() } catch (error) {
      if (error instanceof ApiHttpError) {
        throw new AuthError(error.status,
          error.status === 401 ? "Votre session a expiré. Reconnectez-vous avec votre identifiant d’habitant et votre code."
            : "Le service est indisponible. Réessayez.")
      }
      throw new AuthError("NETWORK_ERROR", "Impossible de joindre le service. Réessayez.")
    }
  }

  async accountStatus(token: string): Promise<AccountAccessStatus> {
    const profile = await this.execute(() => this.get<{ residentId?: string | null; passwordChangeRequired?: boolean }>("/iam/me", ApiClient.authHeaders(token)))
    return { residentId: profile.residentId ?? null, passwordChangeRequired: profile.passwordChangeRequired === true }
  }
}
