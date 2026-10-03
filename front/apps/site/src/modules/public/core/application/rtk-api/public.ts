import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { MunicipalService } from "../../domain/municipal-service"
import type { Publication } from "../../domain/publication"
import { listPublications, listServices } from "../usecases/public-content.usecase"

export const publicApi = createApi({
  reducerPath: "publicApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  endpoints: (build) => ({
    listServices: build.query<MunicipalService[], void>({ queryFn: withUseCase(listServices) }),
    listPublications: build.query<Publication[], void>({ queryFn: withUseCase(listPublications) })
  })
})

export const { useListServicesQuery, useListPublicationsQuery } = publicApi
