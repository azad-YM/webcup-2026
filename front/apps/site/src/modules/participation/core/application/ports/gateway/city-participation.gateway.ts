import type {
  Consultation,
  ContributionDraft,
  ContributionReceipt,
  Idea,
  IdeaDraft,
  MyIdea,
  MyParticipation,
  Project,
  ProjectFilters,
} from "../../../domain/participation"

/**
 * Contrat HTTP du BC Participation (lot L19). Lecture publique sans compte ; contributions, idées
 * et « Mes contributions » avec le jeton du citoyen. Erreurs : `AppError` (404 `not-citizen` sur `/me`).
 */
export interface CityParticipationGateway {
  listProjects(filters: ProjectFilters): Promise<Project[]>
  getProject(id: string): Promise<Project>
  listConsultations(): Promise<Consultation[]>
  getConsultation(id: string): Promise<Consultation>
  listIdeas(): Promise<Idea[]>
  /** Liste fermée des quartiers (Administration, `GET /administration/districts`, public). */
  listDistricts(): Promise<string[]>
  myParticipation(token: string): Promise<MyParticipation>
  contribute(token: string, draft: ContributionDraft): Promise<ContributionReceipt>
  proposeIdea(token: string, draft: IdeaDraft): Promise<MyIdea>
}
