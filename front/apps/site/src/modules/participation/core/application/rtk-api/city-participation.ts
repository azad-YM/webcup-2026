import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { AppError, withUseCase, type QueryError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import {
  validateContribution,
  validateIdea,
  type Consultation,
  type ContributionDraft,
  type ContributionReceipt,
  type Idea,
  type IdeaDraft,
  type MyIdea,
  type MyParticipation,
  type Project,
  type ProjectFilters,
  type ServiceRating,
  type ServiceReview,
  type ServiceReviewDraft,
  validateServiceReview,
} from "../../domain/participation"

export const PARTICIPATION_POLLING_MS = 60_000

const token = (dependencies: Parameters<UseCase<void, void>>[0]) => {
  const value = dependencies.participationSessionProvider.getToken()
  if (!value) throw new AppError(401, "Connectez-vous pour participer.")
  return value
}

const listProjects: UseCase<ProjectFilters, Project[]> = async (deps, filters) => deps.cityParticipationGateway.listProjects(filters)
const getProject: UseCase<string, Project> = async (deps, id) => deps.cityParticipationGateway.getProject(id)
const listConsultations: UseCase<void, Consultation[]> = async (deps) => deps.cityParticipationGateway.listConsultations()
const getConsultation: UseCase<string, Consultation> = async (deps, id) => deps.cityParticipationGateway.getConsultation(id)
const listIdeas: UseCase<void, Idea[]> = async (deps) => deps.cityParticipationGateway.listIdeas()
const listDistricts: UseCase<void, string[]> = async (deps) => deps.cityParticipationGateway.listDistricts()
const myParticipation: UseCase<void, MyParticipation> = async (deps) => deps.cityParticipationGateway.myParticipation(token(deps))

const contribute: UseCase<{ consultation: Consultation; draft: ContributionDraft }, ContributionReceipt> = async (deps, { consultation, draft }) => {
  const auth = token(deps)
  const message = validateContribution(consultation, draft)
  if (message) throw new AppError(422, message)
  return deps.cityParticipationGateway.contribute(auth, draft)
}

const proposeIdea: UseCase<IdeaDraft, MyIdea> = async (deps, draft) => {
  const auth = token(deps)
  const [field, message] = Object.entries(validateIdea(draft))[0] ?? []
  if (message) throw new AppError(422, message, { field })
  return deps.cityParticipationGateway.proposeIdea(auth, draft)
}

const reviewService: UseCase<ServiceReviewDraft, ServiceReview> = async (deps, draft) => {
  const auth = token(deps)
  const message = validateServiceReview(draft)
  if (message) throw new AppError(422, message)
  return deps.cityParticipationGateway.reviewService(auth, draft)
}
const listServiceRatings: UseCase<string | undefined, ServiceRating[]> = async (deps, serviceId) => deps.cityParticipationGateway.listServiceRatings(serviceId)
const serviceName: UseCase<string, string | null> = async (deps, serviceId) => deps.cityParticipationGateway.serviceName(serviceId)

export const cityParticipationApi = createApi({
  reducerPath: "cityParticipationApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["Projects", "Consultations", "Ideas", "Mine", "Ratings"],
  endpoints: (build) => ({
    listProjects: build.query<Project[], ProjectFilters>({ queryFn: withUseCase(listProjects), providesTags: ["Projects"] }),
    getProject: build.query<Project, string>({ queryFn: withUseCase(getProject), providesTags: ["Projects", "Consultations"] }),
    listConsultations: build.query<Consultation[], void>({ queryFn: withUseCase(listConsultations), providesTags: ["Consultations"] }),
    getConsultation: build.query<Consultation, string>({ queryFn: withUseCase(getConsultation), providesTags: ["Consultations"] }),
    listIdeas: build.query<Idea[], void>({ queryFn: withUseCase(listIdeas), providesTags: ["Ideas"] }),
    listDistricts: build.query<string[], void>({ queryFn: withUseCase(listDistricts), keepUnusedDataFor: 3600 }),
    myParticipation: build.query<MyParticipation, void>({ queryFn: withUseCase(myParticipation), providesTags: ["Mine"] }),
    contribute: build.mutation<ContributionReceipt, { consultation: Consultation; draft: ContributionDraft }>({
      queryFn: withUseCase(contribute),
      invalidatesTags: ["Mine", "Consultations"]
    }),
    // F76 : avis sur les services.
    reviewService: build.mutation<ServiceReview, ServiceReviewDraft>({ queryFn: withUseCase(reviewService), invalidatesTags: ["Mine", "Ratings"] }),
    listServiceRatings: build.query<ServiceRating[], string | undefined>({ queryFn: withUseCase(listServiceRatings), providesTags: ["Ratings"] }),
    serviceName: build.query<string | null, string>({ queryFn: withUseCase(serviceName), keepUnusedDataFor: 3600 }),
    proposeIdea: build.mutation<MyIdea, IdeaDraft>({ queryFn: withUseCase(proposeIdea), invalidatesTags: ["Mine", "Ideas"] })
  })
})

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useListConsultationsQuery,
  useGetConsultationQuery,
  useListIdeasQuery,
  useListDistrictsQuery,
  useMyParticipationQuery,
  useContributeMutation,
  useProposeIdeaMutation,
  useReviewServiceMutation,
  useListServiceRatingsQuery,
  useServiceNameQuery
} = cityParticipationApi
