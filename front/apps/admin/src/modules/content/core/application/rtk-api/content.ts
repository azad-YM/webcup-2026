import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { Alert, MunicipalService, Publication } from "../../domain/content"
import {
  listAlerts,
  listDistricts,
  listPublications,
  listServices,
  saveAlert,
  savePublication,
  saveService,
} from "../usecases/content.usecase"

export const contentApi = createApi({
  reducerPath: "contentApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Services", "Publications", "Alerts"],
  endpoints: (build) => ({
    listServices: build.query<MunicipalService[], void>({ queryFn: withUseCase(listServices), providesTags: ["Services"] }),
    saveService: build.mutation<MunicipalService, MunicipalService>({ queryFn: withUseCase(saveService), invalidatesTags: ["Services"] }),
    listDistricts: build.query<string[], void>({ queryFn: withUseCase(listDistricts), keepUnusedDataFor: 3600 }),
    listPublications: build.query<Publication[], void>({ queryFn: withUseCase(listPublications), providesTags: ["Publications"] }),
    savePublication: build.mutation<Publication, Publication>({ queryFn: withUseCase(savePublication), invalidatesTags: ["Publications"] }),
    listAlerts: build.query<Alert[], void>({ queryFn: withUseCase(listAlerts), providesTags: ["Alerts"] }),
    saveAlert: build.mutation<Alert, Alert>({ queryFn: withUseCase(saveAlert), invalidatesTags: ["Alerts"] }),
  }),
})

export const {
  useListServicesQuery,
  useSaveServiceMutation,
  useListDistrictsQuery,
  useListPublicationsQuery,
  useSavePublicationMutation,
  useListAlertsQuery,
  useSaveAlertMutation,
} = contentApi
