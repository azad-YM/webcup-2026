import type { UnknownAction } from "@reduxjs/toolkit"
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { ReceiptVerification, RequestDraft, RequestMessage, RequestMessages, RequestReceipt, ServiceRequest } from "../../domain/service-request"
import {
  getMyRequest,
  getMyRequestReceipt,
  listMyRequestMessages,
  listMyRequests,
  postMyRequestMessage,
  submitRequest,
  verifyRequestReceipt
} from "../usecases/service-request.usecase"

/** Événements temps réel de Citizen sur le topic `citizen.{citizenId}`. */
export const REQUEST_EVENTS = ["request.submitted", "request.status_changed", "request.message_posted"] as const

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
      dispatch(serviceRequestsApi.util.invalidateTags(["MyRequests", "Messages"]))
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
  tagTypes: ["MyRequests", "Messages"],
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
    }),
    listMyRequestMessages: build.query<RequestMessages, string>({
      queryFn: withUseCase(listMyRequestMessages),
      providesTags: ["Messages"],
      onCacheEntryAdded: followRealtime
    }),
    postMyRequestMessage: build.mutation<RequestMessage, { reference: string; body: string }>({
      queryFn: withUseCase(postMyRequestMessage),
      invalidatesTags: ["Messages", "MyRequests"]
    }),
    getMyRequestReceipt: build.query<RequestReceipt, string>({
      queryFn: withUseCase(getMyRequestReceipt)
    }),
    verifyRequestReceipt: build.mutation<ReceiptVerification, { reference: string; fingerprint: string }>({
      queryFn: withUseCase(verifyRequestReceipt)
    })
  })
})

export const {
  useListMyRequestsQuery,
  useGetMyRequestQuery,
  useSubmitRequestMutation,
  useListMyRequestMessagesQuery,
  usePostMyRequestMessageMutation,
  useGetMyRequestReceiptQuery,
  useVerifyRequestReceiptMutation
} = serviceRequestsApi
