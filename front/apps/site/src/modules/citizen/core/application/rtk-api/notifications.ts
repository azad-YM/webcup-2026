import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { NotificationInbox } from "../../domain/notification"
import { listMyNotifications, markNotificationsRead } from "../usecases/notification.usecase"
import { followRealtime } from "./follow-realtime"

/**
 * Événements du topic `citizen.{citizenId}` qui changent le centre de notifications :
 * `notification.created` (notification persistée) et `request.status_changed` (la notification suit de près).
 */
export const NOTIFICATION_EVENTS = ["notification.created", "request.status_changed"] as const

/** Polling de secours si le flux temps réel est coupé. */
export const NOTIFICATIONS_POLLING_MS = 60_000

export const notificationsApi = createApi({
  reducerPath: "citizenNotificationsApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["Notifications"],
  endpoints: (build) => ({
    listMyNotifications: build.query<NotificationInbox, void>({
      queryFn: withUseCase(listMyNotifications),
      providesTags: ["Notifications"],
      onCacheEntryAdded: followRealtime(NOTIFICATION_EVENTS, (dispatch) => {
        dispatch(notificationsApi.util.invalidateTags(["Notifications"]))
      })
    }),
    markNotificationsRead: build.mutation<null, string[]>({
      queryFn: withUseCase(markNotificationsRead),
      invalidatesTags: ["Notifications"]
    })
  })
})

export const { useListMyNotificationsQuery, useMarkNotificationsReadMutation } = notificationsApi
