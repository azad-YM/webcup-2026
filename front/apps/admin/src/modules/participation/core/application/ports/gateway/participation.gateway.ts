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
  ServiceReviewAction,
  ServiceReview,
  ServiceReviewQueue,
  ServiceReviewStatus,
} from "../../../domain/participation"

/**
 * Gestion de la participation par les agents (BC Participation). Erreurs : `ParticipationError`.
 * Lecture : permission `admin.participation.read` ; écriture : `admin.participation.write`.
 * Quartiers : `GET /administration/districts` (Administration).
 */
export interface ParticipationGateway {
  listDistricts(): Promise<string[]>
  listProjects(): Promise<Project[]>
  saveProject(project: Project): Promise<Project>
  listConsultations(): Promise<Consultation[]>
  saveConsultation(consultation: ConsultationDraft): Promise<Consultation>
  recordOutcome(outcome: ConsultationOutcome): Promise<Consultation>
  listContributions(consultationId: string): Promise<ContributionView[]>
  listIdeas(status: IdeaStatus | null): Promise<Idea[]>
  followIdea(change: IdeaFollowUp): Promise<Idea>
  setIdeaVisibility(change: IdeaVisibility): Promise<Idea>
  /** F76 : avis sur les services (lecture : admin.participation.read ; lu / réponse : admin.participation.write). */
  listServiceReviews(status: ServiceReviewStatus | null): Promise<ServiceReviewQueue>
  handleServiceReview(action: ServiceReviewAction): Promise<ServiceReview>
}
