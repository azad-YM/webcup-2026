import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { RequestDraft, RequestFilter, RequestList, ServiceRequest } from "../../domain/service-request"
import { listRequests, submitRequest } from "../usecases/service-request.usecase"
export const serviceRequestsApi = createApi({
 reducerPath: "serviceRequestsApi", baseQuery: fakeBaseQuery<QueryError>(), tagTypes: ["Requests"],
 endpoints: (build) => ({
  listRequests: build.query<RequestList, RequestFilter>({ queryFn: withUseCase(listRequests), providesTags: ["Requests"],
   async onCacheEntryAdded(_arg, {extra, cacheDataLoaded, cacheEntryRemoved, dispatch}) {
    let stop = () => {}
    try { const {data} = await cacheDataLoaded; stop = (extra as Dependencies).requestRealtime.subscribe(data.topic, () => dispatch(serviceRequestsApi.util.invalidateTags(["Requests"])), ["request.changed"]); await cacheEntryRemoved } catch {} finally {stop()}
   }
  }),
  submitRequest: build.mutation<ServiceRequest, RequestDraft>({queryFn: withUseCase(submitRequest), invalidatesTags: ["Requests"]})
 })
})
export const {useListRequestsQuery, useSubmitRequestMutation} = serviceRequestsApi
