import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { ParticipationError } from "../../../../application/errors/participation.error"
import type { ParticipationGateway } from "../../../../application/ports/gateway/participation.gateway"
import type { ParticipationSessionProvider } from "../../../../application/ports/provider/participation-session.provider"
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
  ServiceReview,
  ServiceReviewAction,
  ServiceReviewQueue,
  ServiceReviewStatus,
} from "../../../../domain/participation"

const READ = "admin.participation.read"
const WRITE = "admin.participation.write"

/** Adaptateur HTTP : `/participation/manage/*` (BC Participation) et `/administration/districts`. */
export class ParticipationHttpGateway extends ApiClient implements ParticipationGateway {
  constructor(baseUrl: string, private readonly session: ParticipationSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  listDistricts() {
    return this.call(() => this.getAuth<string[]>("/administration/districts"), "les quartiers")
  }

  listProjects() {
    return this.call(() => this.getAuth<Project[]>("/participation/manage/projects"), "les projets", READ)
  }

  saveProject(project: Project) {
    return this.call(() => this.putAuth<Project>("/participation/manage/projects", project), "le projet", WRITE)
  }

  listConsultations() {
    return this.call(() => this.getAuth<Consultation[]>("/participation/manage/consultations"), "les consultations", READ)
  }

  saveConsultation(consultation: ConsultationDraft) {
    return this.call(() => this.putAuth<Consultation>("/participation/manage/consultations", consultation), "la consultation", WRITE)
  }

  recordOutcome(outcome: ConsultationOutcome) {
    return this.call(() => this.putAuth<Consultation>("/participation/manage/consultations/outcome", outcome), "le compte rendu", WRITE)
  }

  async listContributions(consultationId: string): Promise<ContributionView[]> {
    const body = await this.call(
      () => this.getAuth<{ items: ContributionView[] }>(`/participation/manage/consultations/${encodeURIComponent(consultationId)}/contributions`),
      "les réponses",
      READ,
    )
    return body.items
  }

  async listIdeas(status: IdeaStatus | null): Promise<Idea[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    const body = await this.call(() => this.getAuth<{ items: Idea[] }>(`/participation/manage/ideas${query}`), "les idées", READ)
    return body.items
  }

  followIdea(change: IdeaFollowUp) {
    return this.call(() => this.putAuth<Idea>("/participation/manage/ideas/status", change), "l’idée", WRITE)
  }

  setIdeaVisibility(change: IdeaVisibility) {
    return this.call(() => this.putAuth<Idea>("/participation/manage/ideas/visibility", change), "l’idée", WRITE)
  }

  listServiceReviews(status: ServiceReviewStatus | null) {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    return this.call(() => this.getAuth<ServiceReviewQueue>(`/participation/manage/service-reviews${query}`), "les avis", READ)
  }

  handleServiceReview(action: ServiceReviewAction) {
    return this.call(() => this.putAuth<ServiceReview>("/participation/manage/service-reviews", action), "l’avis", WRITE)
  }

  private async call<T>(request: () => Promise<T>, what: string, permission?: string): Promise<T> {
    try {
      return await request()
    } catch (error) {
      throw this.translate(error, what, permission)
    }
  }

  private translate(error: unknown, what: string, permission?: string): ParticipationError {
    if (error instanceof ParticipationError) return error
    if (!(error instanceof ApiHttpError)) {
      return new ParticipationError("unavailable", `Impossible de joindre le serveur pour ${what}. Vérifiez votre connexion puis réessayez.`)
    }
    switch (error.status) {
      case 401:
        this.session.invalidate()
        return new ParticipationError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
      case 403:
        return new ParticipationError("forbidden", `Votre compte ne peut pas gérer ${what}${permission ? ` (permission ${permission})` : ""}. Demandez le rôle « Agent municipal » à un administrateur.`)
      case 404:
        return new ParticipationError("not-found", `Impossible de retrouver ${what} : la liste a peut-être changé. Rechargez la page.`)
      case 400:
        // Règle métier refusée : le message de l’API est rédigé en français pour l’agent.
        return new ParticipationError("invalid", error.payload?.message ?? error.payload?.error ?? `${what} : saisie refusée.`)
      case 422:
        return new ParticipationError("invalid", `Certains champs obligatoires sont vides ou trop longs pour ${what}. Vérifiez la saisie.`)
      default:
        return new ParticipationError("unavailable", `Le serveur n’a pas pu traiter ${what}. Réessayez dans quelques instants.`)
    }
  }
}
