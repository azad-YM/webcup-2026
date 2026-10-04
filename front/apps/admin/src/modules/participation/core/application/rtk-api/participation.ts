import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type {
  Consultation,
  ConsultationDraft,
  ConsultationOutcome,
  ContributionView,
  Idea,
  IdeaFollowUp,
  IdeaStatus,
  IdeaVisibility,
  Project,
} from "../../domain/participation"
import {
  followIdea,
  listConsultations,
  listContributions,
  listDistricts,
  listIdeas,
  listProjects,
  recordOutcome,
  saveConsultation,
  saveProject,
  setIdeaVisibility,
} from "../usecases/participation.usecase"

export const participationApi = createApi({
  reducerPath: "participationApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Projects", "Consultations", "Contributions", "Ideas"],
  endpoints: (build) => ({
    listDistricts: build.query<string[], void>({ queryFn: withUseCase(listDistricts), keepUnusedDataFor: 3600 }),
    listProjects: build.query<Project[], void>({ queryFn: withUseCase(listProjects), providesTags: ["Projects"] }),
    saveProject: build.mutation<Project, Project>({ queryFn: withUseCase(saveProject), invalidatesTags: ["Projects"] }),
    listConsultations: build.query<Consultation[], void>({ queryFn: withUseCase(listConsultations), providesTags: ["Consultations"] }),
    saveConsultation: build.mutation<Consultation, ConsultationDraft>({ queryFn: withUseCase(saveConsultation), invalidatesTags: ["Consultations"] }),
    recordOutcome: build.mutation<Consultation, ConsultationOutcome>({ queryFn: withUseCase(recordOutcome), invalidatesTags: ["Consultations"] }),
    listContributions: build.query<ContributionView[], string>({ queryFn: withUseCase(listContributions), providesTags: ["Contributions"] }),
    listIdeas: build.query<Idea[], IdeaStatus | null>({ queryFn: withUseCase(listIdeas), providesTags: ["Ideas"] }),
    followIdea: build.mutation<Idea, IdeaFollowUp>({ queryFn: withUseCase(followIdea), invalidatesTags: ["Ideas"] }),
    setIdeaVisibility: build.mutation<Idea, IdeaVisibility>({ queryFn: withUseCase(setIdeaVisibility), invalidatesTags: ["Ideas"] }),
  }),
})

export const {
  useListDistrictsQuery,
  useListProjectsQuery,
  useSaveProjectMutation,
  useListConsultationsQuery,
  useSaveConsultationMutation,
  useRecordOutcomeMutation,
  useListContributionsQuery,
  useListIdeasQuery,
  useFollowIdeaMutation,
  useSetIdeaVisibilityMutation,
} = participationApi
