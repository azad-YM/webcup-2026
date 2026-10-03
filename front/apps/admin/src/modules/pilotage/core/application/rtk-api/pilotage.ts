import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { WebcupFeed } from "../../domain/webcup-feed"
import { getWebcupFeed } from "../usecases/get-webcup-feed.usecase"
import { getSeenRequestCodes, markRequestsSeen } from "../usecases/seen-requests.usecase"

/** The agents' page refreshes the feed every 30 s; the server itself keeps the API answer for 20 s. */
export const WEBCUP_FEED_POLLING_MS = 30_000

export const pilotageApi = createApi({
  reducerPath: "pilotageApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    getWebcupFeed: build.query<WebcupFeed, void>({
      queryFn: withUseCase(getWebcupFeed),
    }),
    getSeenRequestCodes: build.query<string[] | null, void>({
      queryFn: withUseCase(getSeenRequestCodes),
    }),
    markRequestsSeen: build.mutation<string[], string[]>({
      queryFn: withUseCase(markRequestsSeen),
    }),
  }),
})

export const { useGetWebcupFeedQuery, useGetSeenRequestCodesQuery, useMarkRequestsSeenMutation } = pilotageApi
