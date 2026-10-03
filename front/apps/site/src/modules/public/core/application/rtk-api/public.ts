import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { MunicipalService } from "../../domain/municipal-service"
import type { Publication } from "../../domain/publication"
import { listPublications, listServices } from "../usecases/public-content.usecase"

/** Rafraîchissement de secours des contenus publiés. */
export const CONTENT_POLLING_MS = 60_000

export const publicApi = createApi({
  reducerPath: "publicApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["Services", "Publications"],
  endpoints: (build) => ({
    listServices: build.query<MunicipalService[], void>({ queryFn: withUseCase(listServices), providesTags: ["Services"] }),
    listPublications: build.query<Publication[], void>({
      queryFn: withUseCase(listPublications),
      providesTags: ["Publications"],
      async onCacheEntryAdded(_arg, { extra, dispatch, cacheEntryRemoved }) {
        const unsubscribe = (extra as Dependencies).cityFeedGateway.subscribe((event) => {
          if (event.type.startsWith("publication.")) dispatch(publicApi.util.invalidateTags(["Publications"]))
        })
        await cacheEntryRemoved
        unsubscribe()
      }
    })
  })
})

export const { useListServicesQuery, useListPublicationsQuery } = publicApi
