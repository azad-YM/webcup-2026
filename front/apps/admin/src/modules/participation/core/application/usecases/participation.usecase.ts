import type { UseCase } from "@/modules/shared/core/config/use-cases"
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

export const listDistricts: UseCase<void, string[]> = async (_d, _s, deps) => deps.participationGateway.listDistricts()
export const listProjects: UseCase<void, Project[]> = async (_d, _s, deps) => deps.participationGateway.listProjects()
export const saveProject: UseCase<Project, Project> = async (_d, _s, deps, project) => deps.participationGateway.saveProject(project)
export const listConsultations: UseCase<void, Consultation[]> = async (_d, _s, deps) => deps.participationGateway.listConsultations()
export const saveConsultation: UseCase<ConsultationDraft, Consultation> = async (_d, _s, deps, consultation) =>
  deps.participationGateway.saveConsultation(consultation)
export const recordOutcome: UseCase<ConsultationOutcome, Consultation> = async (_d, _s, deps, outcome) => deps.participationGateway.recordOutcome(outcome)
export const listContributions: UseCase<string, ContributionView[]> = async (_d, _s, deps, id) => deps.participationGateway.listContributions(id)
export const listIdeas: UseCase<IdeaStatus | null, Idea[]> = async (_d, _s, deps, status) => deps.participationGateway.listIdeas(status)
export const followIdea: UseCase<IdeaFollowUp, Idea> = async (_d, _s, deps, change) => deps.participationGateway.followIdea(change)
export const setIdeaVisibility: UseCase<IdeaVisibility, Idea> = async (_d, _s, deps, change) => deps.participationGateway.setIdeaVisibility(change)
