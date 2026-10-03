import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { CityNotice, AlertPreference } from "../../domain/alert"
export const listAlerts: UseCase<void, CityNotice[]> = deps => deps.alertsGateway.alerts()
export const listNotifications: UseCase<void, CityNotice[]> = deps => deps.alertsGateway.notifications()
export const getAlertPreference: UseCase<void, AlertPreference> = deps => deps.alertsGateway.preferences()
export const setAlertConsent: UseCase<boolean, void> = (deps, consent) => deps.alertsGateway.setConsent(consent)
