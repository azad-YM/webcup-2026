import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { MunicipalService } from "../../domain/municipal-service"
import type { Publication } from "../../domain/publication"
import { getServiceRating, listPublications, listServices } from "../usecases/public-content.usecase"
import type { ServiceRatingSummary } from "../ports/provider/service-ratings.provider"
import type { Explanation, ExplainParams, ServiceSearchParams, ServiceSearchResult } from "../../domain/service-search"
import { explainPassage, refineServiceSearch, searchServices } from "../usecases/assistance.usecase"
import type { TransportLine, TripHelp, TripRequest } from "../../domain/transport"
import { findTrip, listTransportLines } from "../usecases/transport.usecase"

/** Rafraîchissement de secours des contenus publiés. */
export const CONTENT_POLLING_MS = 60_000

export const publicApi = createApi({
  reducerPath: "publicApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["Services", "Publications", "TransportLines"],
  endpoints: (build) => ({
    listServices: build.query<MunicipalService[], void>({
      queryFn: withUseCase(listServices),
      providesTags: ["Services"],
      // F63 : une désactivation (ou réactivation) apparaît sans rechargement sur les fiches et les formulaires.
      async onCacheEntryAdded(_arg, { extra, dispatch, cacheEntryRemoved }) {
        const unsubscribe = (extra as Dependencies).cityFeedGateway.subscribe((event) => {
          if (event.type === "service.availability") dispatch(publicApi.util.invalidateTags(["Services"]))
        })
        await cacheEntryRemoved
        unsubscribe()
      }
    }),
    // F76 : note moyenne d’un service (Participation, par le port ServiceRatingsProvider).
    getServiceRating: build.query<ServiceRatingSummary | null, string>({ queryFn: withUseCase(getServiceRating), keepUnusedDataFor: 300 }),
    // D10 : recherche tolérante (BC Assistance) ; F90 : explication simple d’un passage. Rien n’est stocké.
    searchServices: build.query<ServiceSearchResult, ServiceSearchParams>({ queryFn: withUseCase(searchServices), keepUnusedDataFor: 300 }),
    refineServiceSearch: build.query<ServiceSearchResult, ServiceSearchParams>({ queryFn: withUseCase(refineServiceSearch), keepUnusedDataFor: 600 }),
    explainPassage: build.query<Explanation, ExplainParams>({ queryFn: withUseCase(explainPassage), keepUnusedDataFor: 600 }),
    // F97 : état des lignes de transport (Administration) et aide au trajet (Assistance, rien n’est stocké).
    listTransportLines: build.query<TransportLine[], void>({ queryFn: withUseCase(listTransportLines), providesTags: ["TransportLines"] }),
    findTrip: build.mutation<TripHelp, TripRequest>({ queryFn: withUseCase(findTrip) }),
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

export const {
  useListServicesQuery,
  useListPublicationsQuery,
  useSearchServicesQuery,
  useLazyRefineServiceSearchQuery,
  useLazyExplainPassageQuery, useGetServiceRatingQuery,
  useListTransportLinesQuery,
  useFindTripMutation } = publicApi
