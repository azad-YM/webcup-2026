import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { PilotageError } from "../../../../application/errors/pilotage.error"
import type { ActivityDashboardGateway } from "../../../../application/ports/gateway/activity-dashboard.gateway"
import type { PilotageSessionProvider } from "../../../../application/ports/provider/pilotage-session.provider"
import type { ActivityDashboard } from "../../../../domain/activity-dashboard"

export class ActivityDashboardHttpGateway extends ApiClient implements ActivityDashboardGateway {
  constructor(baseUrl: string, private readonly session: PilotageSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  async fetchDashboard(): Promise<ActivityDashboard> {
    try {
      return await this.getAuth<ActivityDashboard>("/pilotage/activity")
    } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) {
          this.session.invalidate()
          throw new PilotageError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
        }
        if (error.status === 403) {
          throw new PilotageError("forbidden", "Votre compte n’a pas accès au tableau de bord (permission admin.pilotage.read).")
        }
      }
      throw new PilotageError("unavailable", "Le tableau de bord est indisponible. Réessayez dans quelques instants.")
    }
  }
}
