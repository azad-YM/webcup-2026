import type { ActivityDashboard } from "../../../domain/activity-dashboard"

export interface ActivityDashboardGateway {
  fetchDashboard(): Promise<ActivityDashboard>
}
