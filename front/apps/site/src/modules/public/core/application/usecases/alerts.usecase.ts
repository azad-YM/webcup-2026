import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { AlertPreference, CitizenNotifications, CityAlert } from "../../domain/alert"

export const listAlerts: UseCase<void, CityAlert[]> = (dependencies) => dependencies.alertsGateway.listAlerts()

export const listOfficialMessages: UseCase<void, CityAlert[]> = (dependencies) => dependencies.alertsGateway.listOfficialMessages()

/** F73 : « J'ai lu » est mémorisé dans ce navigateur seulement. */
export const getReadOfficialMessages: UseCase<void, string[]> = (dependencies) => dependencies.officialMessageReadGateway.readIds()

export const markOfficialMessageRead: UseCase<string, string[]> = (dependencies, id) => dependencies.officialMessageReadGateway.markRead(id)

export const getMyNotifications: UseCase<void, CitizenNotifications> = (dependencies) => dependencies.alertsGateway.myNotifications()

export const getMyAlertPreference: UseCase<void, AlertPreference> = (dependencies) => dependencies.alertsGateway.myPreference()

export const setHealthConsent: UseCase<boolean, AlertPreference> = (dependencies, consent) => dependencies.alertsGateway.setHealthConsent(consent)
