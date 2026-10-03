import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { ActivityDashboard } from "../../domain/activity-dashboard"

export const getActivityDashboard: UseCase<void, ActivityDashboard> = async (_dispatch, _getState, dependencies) =>
  dependencies.activityDashboardGateway.fetchDashboard()
