import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { RequestQueue, RequestQueueFilter, ServiceRequest, StatusChange } from "../../domain/service-request"
import { changeRequestStatus, listRequestQueue } from "../usecases/request-queue.usecase"

/** Events published by Citizen on `administration.requests`. */
export const REQUEST_EVENTS = ["request.submitted", "request.status_changed"] as const

/** Safety net when the realtime stream is down. */
export const REQUEST_QUEUE_POLLING_MS = 60_000

export const requestsApi = createApi({
  reducerPath: "requestsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["RequestQueue"],
  endpoints: (build) => ({
    listRequestQueue: build.query<RequestQueue, RequestQueueFilter>({
      queryFn: withUseCase(listRequestQueue),
      providesTags: ["RequestQueue"],
      // While the queue is displayed, a realtime event reloads it from the API.
      async onCacheEntryAdded(_filter, { extra, dispatch, cacheDataLoaded, cacheEntryRemoved }) {
        let unsubscribe: () => void = () => undefined
        try {
          await cacheDataLoaded
          unsubscribe = (extra as Dependencies).realtime.subscribe(REQUEST_EVENTS, () => {
            dispatch(requestsApi.util.invalidateTags(["RequestQueue"]))
          })
        } catch {
          /* Failed load: no subscription, polling and "Réessayer" take over. */
        }
        await cacheEntryRemoved
        unsubscribe()
      },
    }),
    changeRequestStatus: build.mutation<ServiceRequest, StatusChange>({
      queryFn: withUseCase(changeRequestStatus),
      invalidatesTags: ["RequestQueue"],
    }),
  }),
})

export const { useListRequestQueueQuery, useChangeRequestStatusMutation } = requestsApi
