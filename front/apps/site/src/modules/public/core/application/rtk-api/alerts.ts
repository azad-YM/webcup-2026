import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { AlertPreference, CitizenNotifications, CityAlert } from "../../domain/alert"
import { getMyAlertPreference, getMyNotifications, listAlerts, setHealthConsent } from "../usecases/alerts.usecase"

/** Rafraîchissement de secours si le flux temps réel est coupé. */
export const ALERTS_POLLING_MS = 60_000

export const alertsApi = createApi({
  reducerPath: "alertsApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["Alerts", "Notifications", "Preference"],
  endpoints: (build) => ({
    listAlerts: build.query<CityAlert[], void>({
      queryFn: withUseCase(listAlerts),
      providesTags: ["Alerts"],
      // Une alerte publiée ou retirée recharge le bandeau et les notifications.
      async onCacheEntryAdded(_arg, { extra, dispatch, cacheDataLoaded, cacheEntryRemoved }) {
        const unsubscribe = (extra as Dependencies).cityFeedGateway.subscribe((event) => {
          if (event.type.startsWith("alert.")) dispatch(alertsApi.util.invalidateTags(["Alerts", "Notifications"]))
          if (event.type === "publication.important") dispatch(alertsApi.util.invalidateTags(["Notifications"]))
        })
        try {
          await cacheDataLoaded
        } catch {
          /* L’erreur est affichée par l’écran ; l’abonnement reste utile pour la prochaine tentative. */
        }
        await cacheEntryRemoved
        unsubscribe()
      }
    }),
    myNotifications: build.query<CitizenNotifications, void>({
      queryFn: withUseCase(getMyNotifications),
      providesTags: ["Notifications"]
    }),
    myAlertPreference: build.query<AlertPreference, void>({
      queryFn: withUseCase(getMyAlertPreference),
      providesTags: ["Preference"]
    }),
    setHealthConsent: build.mutation<AlertPreference, boolean>({
      queryFn: withUseCase(setHealthConsent),
      invalidatesTags: ["Preference", "Notifications"]
    })
  })
})

export const { useListAlertsQuery, useMyNotificationsQuery, useMyAlertPreferenceQuery, useSetHealthConsentMutation } = alertsApi
