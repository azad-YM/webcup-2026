import type { ActivityDashboard } from "../../../domain/activity-dashboard"
import type { ActivityReport, ReportPeriodChoice, ServiceUsageReport } from "../../../domain/activity-report"

export interface ActivityDashboardGateway {
  fetchDashboard(): Promise<ActivityDashboard>
  /** F98 : `GET /pilotage/service-usage`. */
  fetchServiceUsage(period: ReportPeriodChoice): Promise<ServiceUsageReport>
  /** F103 : `GET /pilotage/activity-report`. */
  fetchActivityReport(period: ReportPeriodChoice): Promise<ActivityReport>
}
