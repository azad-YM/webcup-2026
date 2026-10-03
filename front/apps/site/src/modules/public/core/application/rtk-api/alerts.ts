import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { CityNotice, AlertPreference } from "../../domain/alert"
import { listAlerts, listNotifications, getAlertPreference, setAlertConsent } from "../usecases/alerts.usecase"
export const alertsApi = createApi({ reducerPath: "alertsApi", baseQuery: fakeBaseQuery<QueryError>(), tagTypes: ["Alerts", "Preferences"], endpoints: b => ({
 alerts: b.query<CityNotice[], void>({ queryFn: withUseCase(listAlerts), providesTags: ["Alerts"], async onCacheEntryAdded(_arg, api) { const stop = (api.extra as Dependencies).alertsGateway.subscribe(() => api.dispatch(alertsApi.util.invalidateTags(["Alerts"]))); await api.cacheEntryRemoved; stop() } }),
 notifications: b.query<CityNotice[], void>({ queryFn: withUseCase(listNotifications), providesTags: ["Alerts"], async onCacheEntryAdded(_arg, api) { const stop = (api.extra as Dependencies).alertsGateway.subscribe(() => api.dispatch(alertsApi.util.invalidateTags(["Alerts"]))); await api.cacheEntryRemoved; stop() } }),
 alertPreference: b.query<AlertPreference, void>({ queryFn: withUseCase(getAlertPreference), providesTags: ["Preferences"] }),
 setAlertConsent: b.mutation<void, boolean>({ queryFn: withUseCase(setAlertConsent), invalidatesTags: ["Preferences", "Alerts"] })
}) })
export const { useAlertsQuery, useNotificationsQuery, useAlertPreferenceQuery, useSetAlertConsentMutation } = alertsApi
