import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { RequestFilter, RequestList, ServiceRequest, StatusChange } from "../../domain/service-request"
import { listRequests, changeRequestStatus } from "../usecases/requests.usecase"
export const requestsApi=createApi({reducerPath:"requestsApi",baseQuery:fakeBaseQuery(),tagTypes:["Requests"],endpoints:build=>({
 listRequests:build.query<RequestList,RequestFilter>({queryFn:withUseCase(listRequests),providesTags:["Requests"],async onCacheEntryAdded(_arg,{extra,cacheDataLoaded,cacheEntryRemoved,dispatch}){let stop=()=>{};try{const {data}=await cacheDataLoaded;stop=(extra as Dependencies).requestRealtime.subscribe(data.topic,()=>dispatch(requestsApi.util.invalidateTags(["Requests"])),["request.changed"]);await cacheEntryRemoved}catch{}finally{stop()}}}),
 changeRequestStatus:build.mutation<ServiceRequest,StatusChange>({queryFn:withUseCase(changeRequestStatus),invalidatesTags:["Requests"]})
})})
export const {useListRequestsQuery,useChangeRequestStatusMutation}=requestsApi
