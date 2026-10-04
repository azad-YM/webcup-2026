import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { ActivityDashboard } from "../../domain/activity-dashboard"
import type { ActivityReport, ReportPeriodChoice, ServiceUsageReport } from "../../domain/activity-report"

export const getActivityDashboard: UseCase<void, ActivityDashboard> = async (_dispatch, _getState, dependencies) =>
  dependencies.activityDashboardGateway.fetchDashboard()

export const getServiceUsage: UseCase<ReportPeriodChoice, ServiceUsageReport> = async (_dispatch, _getState, dependencies, period) =>
  dependencies.activityDashboardGateway.fetchServiceUsage(period)

export const getActivityReport: UseCase<ReportPeriodChoice, ActivityReport> = async (_dispatch, _getState, dependencies, period) =>
  dependencies.activityDashboardGateway.fetchActivityReport(period)

/** F98, F103 : fichier produit sur place (CSV, Markdown) et proposé au téléchargement. */
export const downloadReportFile: UseCase<{ fileName: string; mimeType: string; content: string }, null> = async (_dispatch, _getState, dependencies, file) => {
  dependencies.fileDownloader.download({ ...file, rowCount: 0, truncated: false })
  return null
}
