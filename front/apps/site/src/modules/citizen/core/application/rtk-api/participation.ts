import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { AppError, withUseCase, type QueryError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import { validateConcern, type Concern, type ConcernDraft, type PublicRequest, type SupportChange } from "../../domain/participation"
import { requireToken } from "../usecases/notification.usecase"
import { followRealtime } from "./follow-realtime"

export const PARTICIPATION_POLLING_MS = 60_000

const token = (dependencies: Parameters<UseCase<void, void>>[0]) => requireToken(dependencies.citizenSessionProvider.getToken())

const listPublicRequests: UseCase<void, PublicRequest[]> = async (dependencies) =>
  dependencies.participationGateway.listPublicRequests(token(dependencies))

const support: UseCase<SupportChange, PublicRequest> = async (dependencies, change) =>
  dependencies.participationGateway.support(token(dependencies), change)

const listConcerns: UseCase<void, Concern[]> = async (dependencies) =>
  dependencies.participationGateway.listConcerns(token(dependencies))

const raiseConcern: UseCase<ConcernDraft, Concern> = async (dependencies, draft) => {
  const auth = token(dependencies)
  const [field, message] = Object.entries(validateConcern(draft))[0] ?? []
  if (message) throw new AppError(422, message, { field })
  return dependencies.participationGateway.raiseConcern(auth, { topic: draft.topic, subject: draft.subject.trim(), message: draft.message.trim() })
}

export const participationApi = createApi({
  reducerPath: "citizenParticipationApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["PublicRequests", "Concerns"],
  endpoints: (build) => ({
    listPublicRequests: build.query<PublicRequest[], void>({
      queryFn: withUseCase(listPublicRequests),
      providesTags: ["PublicRequests"]
    }),
    support: build.mutation<PublicRequest, SupportChange>({
      queryFn: withUseCase(support),
      invalidatesTags: ["PublicRequests"]
    }),
    listConcerns: build.query<Concern[], void>({
      queryFn: withUseCase(listConcerns),
      providesTags: ["Concerns"],
      // Une réponse d'agent crée une notification `concern.updated` : on relit les inquiétudes.
      onCacheEntryAdded: followRealtime(["notification.created"], (dispatch, event) => {
        const data = event.data as { kind?: unknown } | null
        if (data?.kind === "concern.updated") dispatch(participationApi.util.invalidateTags(["Concerns"]))
      })
    }),
    raiseConcern: build.mutation<Concern, ConcernDraft>({
      queryFn: withUseCase(raiseConcern),
      invalidatesTags: ["Concerns"]
    })
  })
})

export const { useListPublicRequestsQuery, useSupportMutation, useListConcernsQuery, useRaiseConcernMutation } = participationApi
