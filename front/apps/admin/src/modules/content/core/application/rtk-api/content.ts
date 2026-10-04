import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { Alert, MunicipalService, PlainLanguageDraft, Publication, PublicationPlainLanguageRequest, ServiceAvailabilityChange, ServicePlainLanguageRequest } from "../../domain/content"
import {
  listAlerts,
  listDistricts,
  listPublications,
  listServices,
  saveAlert,
  savePublication,
  saveService,
  setServiceAvailability,
  suggestPublicationPlainLanguage,
  suggestServicePlainLanguage,
} from "../usecases/content.usecase"

export const contentApi = createApi({
  reducerPath: "contentApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Services", "Publications", "Alerts"],
  endpoints: (build) => ({
    listServices: build.query<MunicipalService[], void>({ queryFn: withUseCase(listServices), providesTags: ["Services"] }),
    saveService: build.mutation<MunicipalService, MunicipalService>({ queryFn: withUseCase(saveService), invalidatesTags: ["Services"] }),
    setServiceAvailability: build.mutation<MunicipalService, ServiceAvailabilityChange>({ queryFn: withUseCase(setServiceAvailability), invalidatesTags: ["Services"] }),
    listDistricts: build.query<string[], void>({ queryFn: withUseCase(listDistricts), keepUnusedDataFor: 3600 }),
    listPublications: build.query<Publication[], void>({ queryFn: withUseCase(listPublications), providesTags: ["Publications"] }),
    savePublication: build.mutation<Publication, Publication>({ queryFn: withUseCase(savePublication), invalidatesTags: ["Publications"] }),
    listAlerts: build.query<Alert[], void>({ queryFn: withUseCase(listAlerts), providesTags: ["Alerts"] }),
    saveAlert: build.mutation<Alert, Alert>({ queryFn: withUseCase(saveAlert), invalidatesTags: ["Alerts"] }),
    // F89 : brouillon « En clair », rien n’est enregistré tant que l’agent n’enregistre pas la fiche.
    suggestServicePlainLanguage: build.mutation<PlainLanguageDraft, ServicePlainLanguageRequest>({ queryFn: withUseCase(suggestServicePlainLanguage) }),
    suggestPublicationPlainLanguage: build.mutation<PlainLanguageDraft, PublicationPlainLanguageRequest>({ queryFn: withUseCase(suggestPublicationPlainLanguage) }),
  }),
})

export const {
  useListServicesQuery,
  useSaveServiceMutation,
  useSetServiceAvailabilityMutation,
  useListDistrictsQuery,
  useListPublicationsQuery,
  useSavePublicationMutation,
  useListAlertsQuery,
  useSaveAlertMutation,
  useSuggestServicePlainLanguageMutation,
  useSuggestPublicationPlainLanguageMutation,
} = contentApi
