import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { PilotageError } from "../../../../application/errors/pilotage.error"
import type { ActivityDashboardGateway } from "../../../../application/ports/gateway/activity-dashboard.gateway"
import type { PilotageSessionProvider } from "../../../../application/ports/provider/pilotage-session.provider"
import type { ActivityDashboard } from "../../../../domain/activity-dashboard"
import { periodQuery, type ActivityReport, type ReportPeriodChoice, type ServiceUsageReport } from "../../../../domain/activity-report"

export class ActivityDashboardHttpGateway extends ApiClient implements ActivityDashboardGateway {
  constructor(baseUrl: string, private readonly session: PilotageSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  fetchDashboard(): Promise<ActivityDashboard> {
    return this.read(() => this.getAuth<ActivityDashboard>("/pilotage/activity"), "le tableau de bord")
  }

  fetchServiceUsage(period: ReportPeriodChoice): Promise<ServiceUsageReport> {
    return this.read(() => this.getAuth<ServiceUsageReport>(`/pilotage/service-usage?${periodQuery(period)}`), "le classement des services")
  }

  fetchActivityReport(period: ReportPeriodChoice): Promise<ActivityReport> {
    return this.read(() => this.getAuth<ActivityReport>(`/pilotage/activity-report?${periodQuery(period)}`), "le rapport d’activité")
  }

  private async read<T>(request: () => Promise<T>, what: string): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) {
          this.session.invalidate()
          throw new PilotageError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
        }
        if (error.status === 403) {
          throw new PilotageError("forbidden", `Votre compte n’a pas accès à ${what} (permission admin.pilotage.read).`)
        }
        if (error.status === 400 || error.status === 422) {
          throw new PilotageError("unavailable", "Période invalide : vérifiez les dates (366 jours au plus).")
        }
      }
      throw new PilotageError("unavailable", `${what[0]?.toUpperCase()}${what.slice(1)} est indisponible. Réessayez dans quelques instants.`)
    }
  }
}
