import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { AlertPreference, CitizenNotifications, CityAlert, SavedAlerts } from "../../domain/alert"

export const listAlerts: UseCase<void, CityAlert[]> = (dependencies) => dependencies.alertsGateway.listAlerts()

export const listOfficialMessages: UseCase<void, CityAlert[]> = (dependencies) => dependencies.alertsGateway.listOfficialMessages()

/** F73 : « J'ai lu » est mémorisé dans ce navigateur seulement. */
export const getReadOfficialMessages: UseCase<void, string[]> = (dependencies) => dependencies.officialMessageReadGateway.readIds()

export const markOfficialMessageRead: UseCase<string, string[]> = (dependencies, id) => dependencies.officialMessageReadGateway.markRead(id)

export const getMyNotifications: UseCase<void, CitizenNotifications> = (dependencies) => dependencies.alertsGateway.myNotifications()

export const getMyAlertPreference: UseCase<void, AlertPreference> = (dependencies) => dependencies.alertsGateway.myPreference()

export const setHealthConsent: UseCase<boolean, AlertPreference> = (dependencies, consent) => dependencies.alertsGateway.setHealthConsent(consent)

export const listDistricts: UseCase<void, string[]> = (dependencies) => dependencies.alertsGateway.listDistricts()

/** F101 : quartier choisi sur cet appareil (personne non connectée), pour cibler le bandeau d’alertes. */
export const getChosenDistrict: UseCase<void, string | null> = (dependencies) => dependencies.safetyKitGateway.district()

export const chooseDistrict: UseCase<string | null, string | null> = (dependencies, district) => dependencies.safetyKitGateway.chooseDistrict(district)

/** F93, F104 : dernière copie des alertes et consignes, relue quand le réseau est coupé. */
export const getSavedAlerts: UseCase<void, SavedAlerts | null> = (dependencies) => dependencies.safetyKitGateway.savedAlerts()

export const saveAlerts: UseCase<CityAlert[], SavedAlerts> = (dependencies, alerts) => dependencies.safetyKitGateway.saveAlerts(alerts, new Date().toISOString())
