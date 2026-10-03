import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { RequestTracking, TrackingInput, WebcupFeed } from "../../domain/webcup-feed"
import { getWebcupFeed } from "../usecases/get-webcup-feed.usecase"
import { getSeenRequestCodes, markRequestsSeen } from "../usecases/seen-requests.usecase"
import { updateTracking } from "../usecases/update-tracking.usecase"
import { getActivityDashboard } from "../usecases/get-activity-dashboard.usecase"
import type { ActivityDashboard } from "../../domain/activity-dashboard"

/** The agents' page refreshes the feed every 30 s; the server itself keeps the API answer for 20 s. */
export const WEBCUP_FEED_POLLING_MS = 30_000
/** The activity dashboard (F50) refreshes every minute. */
export const ACTIVITY_POLLING_MS = 60_000

export const pilotageApi = createApi({
  reducerPath: "pilotageApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    getWebcupFeed: build.query<WebcupFeed, void>({
      queryFn: withUseCase(getWebcupFeed),
    }),
    getActivityDashboard: build.query<ActivityDashboard, void>({
      queryFn: withUseCase(getActivityDashboard),
    }),
    getSeenRequestCodes: build.query<string[] | null, void>({
      queryFn: withUseCase(getSeenRequestCodes),
    }),
    markRequestsSeen: build.mutation<string[], string[]>({
      queryFn: withUseCase(markRequestsSeen),
    }),
    updateTracking: build.mutation<RequestTracking, { requestCode: string; input: TrackingInput }>({
      queryFn: withUseCase(updateTracking),
      // The saved tracking replaces the cached one at once; the next polling confirms it.
      async onQueryStarted({ requestCode }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(pilotageApi.util.updateQueryData("getWebcupFeed", undefined, feed => {
          const request = feed.requests.find(item => item.requestCode === requestCode)
          if (request) request.tracking = data
        }))
      },
    }),
  }),
})

export const { useGetWebcupFeedQuery, useGetSeenRequestCodesQuery, useMarkRequestsSeenMutation, useUpdateTrackingMutation, useGetActivityDashboardQuery } = pilotageApi
