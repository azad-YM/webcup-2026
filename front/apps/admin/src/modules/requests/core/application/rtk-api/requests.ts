import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type {
  GroupStatusChange,
  GroupStatusResult,
  PriorityChange,
  RequestMessage,
  RequestQueue,
  RequestQueueFilter,
  ServiceRequest,
  SimilarRequests,
  StatusChange,
} from "../../domain/service-request"
import {
  changeGroupStatus,
  changeRequestStatus,
  findSimilarRequests,
  linkRequests,
  listRequestMessages,
  listRequestQueue,
  markEmergencyHandled,
  replyToRequest,
  setRequestPriority,
  unlinkRequest,
} from "../usecases/request-queue.usecase"

/** Events published by Citizen on `administration.requests` (L2, L23). */
export const REQUEST_EVENTS = [
  "request.submitted",
  "request.status_changed",
  "request.medical_emergency",
  "request.updated",
  "request.message_posted",
] as const

/** Safety net when the realtime stream is down. */
export const REQUEST_QUEUE_POLLING_MS = 60_000

const TAGS = ["RequestQueue", "Similar", "Messages"] as const

export const requestsApi = createApi({
  reducerPath: "requestsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: TAGS,
  endpoints: (build) => ({
    listRequestQueue: build.query<RequestQueue, RequestQueueFilter>({
      queryFn: withUseCase(listRequestQueue),
      providesTags: ["RequestQueue"],
      // While the queue is displayed, a realtime event reloads it (and the open panels) from the API.
      async onCacheEntryAdded(_filter, { extra, dispatch, cacheDataLoaded, cacheEntryRemoved }) {
        let unsubscribe: () => void = () => undefined
        try {
          await cacheDataLoaded
          unsubscribe = (extra as Dependencies).realtime.subscribe(REQUEST_EVENTS, () => {
            dispatch(requestsApi.util.invalidateTags([...TAGS]))
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
      invalidatesTags: ["RequestQueue", "Similar"],
    }),
    setRequestPriority: build.mutation<ServiceRequest, PriorityChange>({
      queryFn: withUseCase(setRequestPriority),
      invalidatesTags: ["RequestQueue"],
    }),
    markEmergencyHandled: build.mutation<ServiceRequest, string>({
      queryFn: withUseCase(markEmergencyHandled),
      invalidatesTags: ["RequestQueue"],
    }),
    findSimilarRequests: build.query<SimilarRequests, string>({
      queryFn: withUseCase(findSimilarRequests),
      providesTags: ["Similar"],
    }),
    linkRequests: build.mutation<{ groupId: string; references: string[] }, { requestId: string; otherIds: string[] }>({
      queryFn: withUseCase(linkRequests),
      invalidatesTags: ["RequestQueue", "Similar"],
    }),
    unlinkRequest: build.mutation<{ groupId: string | null; references: string[] }, string>({
      queryFn: withUseCase(unlinkRequest),
      invalidatesTags: ["RequestQueue", "Similar"],
    }),
    changeGroupStatus: build.mutation<GroupStatusResult, GroupStatusChange>({
      queryFn: withUseCase(changeGroupStatus),
      invalidatesTags: ["RequestQueue", "Similar"],
    }),
    listRequestMessages: build.query<RequestMessage[], string>({
      queryFn: withUseCase(listRequestMessages),
      providesTags: ["Messages"],
    }),
    replyToRequest: build.mutation<RequestMessage, { requestId: string; body: string }>({
      queryFn: withUseCase(replyToRequest),
      invalidatesTags: ["Messages", "RequestQueue"],
    }),
  }),
})

export const {
  useListRequestQueueQuery,
  useChangeRequestStatusMutation,
  useSetRequestPriorityMutation,
  useMarkEmergencyHandledMutation,
  useFindSimilarRequestsQuery,
  useLinkRequestsMutation,
  useUnlinkRequestMutation,
  useChangeGroupStatusMutation,
  useListRequestMessagesQuery,
  useReplyToRequestMutation,
} = requestsApi
