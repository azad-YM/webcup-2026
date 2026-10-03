import type { UnknownAction } from "@reduxjs/toolkit"
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { RequestDraft, ServiceRequest } from "../../domain/service-request"
import { getMyRequest, listMyRequests, submitRequest } from "../usecases/service-request.usecase"

/** Événements temps réel de Citizen sur le topic `citizen.{citizenId}`. */
export const REQUEST_EVENTS = ["request.submitted", "request.status_changed"] as const

/** Polling de secours si le flux temps réel est coupé. */
export const REQUESTS_POLLING_MS = 60_000

type CacheLifecycle = {
  extra: unknown
  dispatch: (action: UnknownAction) => unknown
  cacheDataLoaded: Promise<unknown>
  cacheEntryRemoved: Promise<void>
}

/** Tant qu'un écran affiche des demandes, un événement du flux recharge les demandes depuis l'API. */
async function followRealtime(_arg: unknown, { extra, dispatch, cacheDataLoaded, cacheEntryRemoved }: CacheLifecycle) {
  let unsubscribe: () => void = () => undefined
  try {
    await cacheDataLoaded
    unsubscribe = (extra as Dependencies).realtime.subscribe(REQUEST_EVENTS, () => {
      dispatch(serviceRequestsApi.util.invalidateTags(["MyRequests"]))
    })
  } catch {
    /* Chargement en échec : pas d'abonnement, le polling et « Réessayer » prennent le relais. */
  }
  await cacheEntryRemoved
  unsubscribe()
}

export const serviceRequestsApi = createApi({
  reducerPath: "serviceRequestsApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["MyRequests"],
  endpoints: (build) => ({
    listMyRequests: build.query<ServiceRequest[], void>({
      queryFn: withUseCase(listMyRequests),
      providesTags: ["MyRequests"],
      onCacheEntryAdded: followRealtime
    }),
    getMyRequest: build.query<ServiceRequest, string>({
      queryFn: withUseCase(getMyRequest),
      providesTags: ["MyRequests"],
      onCacheEntryAdded: followRealtime
    }),
    submitRequest: build.mutation<ServiceRequest, RequestDraft>({
      queryFn: withUseCase(submitRequest),
      invalidatesTags: ["MyRequests"]
    })
  })
})

export const { useListMyRequestsQuery, useGetMyRequestQuery, useSubmitRequestMutation } = serviceRequestsApi
