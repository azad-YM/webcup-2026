import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import { listServices, listPublications, saveService, savePublication } from "../usecases/content.usecase"
import type { MunicipalService, Publication } from "../../domain/content"
export const contentApi = createApi({ reducerPath: "contentApi", baseQuery: fakeBaseQuery(), tagTypes: ["Services", "Publications"], endpoints: b => ({
 services: b.query<MunicipalService[], void>({ queryFn: withUseCase(listServices), providesTags: ["Services"] }),
 publications: b.query<Publication[], void>({ queryFn: withUseCase(listPublications), providesTags: ["Publications"] }),
 saveService: b.mutation<void, MunicipalService>({ queryFn: withUseCase(saveService), invalidatesTags: ["Services"] }),
 savePublication: b.mutation<void, Publication>({ queryFn: withUseCase(savePublication), invalidatesTags: ["Publications"] })
}) })
export const { useServicesQuery, usePublicationsQuery, useSaveServiceMutation, useSavePublicationMutation } = contentApi
