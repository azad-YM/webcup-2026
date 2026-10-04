import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { CityParticipationGateway } from "../../../../application/ports/gateway/city-participation.gateway"
import { NOT_CITIZEN } from "../../../../domain/participation"
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
} from "../../../../domain/participation"

type Messages = Partial<Record<number, string>>

/** `/participation/*` : lecture publique et participation du citoyen connecté. */
export class CityParticipationHttpGateway extends ApiClient implements CityParticipationGateway {
  async listProjects(filters: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams()
    if (filters.district) params.set("district", filters.district)
    if (filters.status) params.set("status", filters.status)
    const query = params.toString()
    const body = await this.call(() => this.get<{ items: Project[] }>(`/participation/projects${query ? `?${query}` : ""}`))
    return body.items
  }

  getProject(id: string): Promise<Project> {
    return this.call(() => this.get<Project>(`/participation/projects/${encodeURIComponent(id)}`), { 404: "Ce projet est introuvable ou n’est plus publié." })
  }

  async listConsultations(): Promise<Consultation[]> {
    const body = await this.call(() => this.get<{ items: Consultation[] }>("/participation/consultations"))
    return body.items
  }

  getConsultation(id: string): Promise<Consultation> {
    return this.call(() => this.get<Consultation>(`/participation/consultations/${encodeURIComponent(id)}`), { 404: "Cette consultation est introuvable ou n’est plus publiée." })
  }

  async listIdeas(): Promise<Idea[]> {
    const body = await this.call(() => this.get<{ items: Idea[] }>("/participation/ideas"))
    return body.items
  }

  listDistricts(): Promise<string[]> {
    return this.call(() => this.get<string[]>("/administration/districts"))
  }

  myParticipation(token: string): Promise<MyParticipation> {
    return this.call(() => this.get<MyParticipation>("/participation/me", ApiClient.authHeaders(token)), {}, true)
  }

  contribute(token: string, draft: ContributionDraft): Promise<ContributionReceipt> {
    const body = { consultationId: draft.consultationId, choice: draft.choice, rating: draft.rating, comment: draft.comment.trim() || null }
    return this.call(() => this.put<ContributionReceipt>("/participation/me/contributions", body, ApiClient.authHeaders(token)), {
      422: "Votre réponse n’a pas pu être enregistrée. Vérifiez votre choix et la longueur du commentaire."
    }, true)
  }

  proposeIdea(token: string, draft: IdeaDraft): Promise<MyIdea> {
    const body = { title: draft.title.trim(), description: draft.description.trim(), district: draft.district || null }
    return this.call(() => this.post<MyIdea>("/participation/me/ideas", body, ApiClient.authHeaders(token)), {
      422: "Votre idée n’a pas pu être enregistrée. Vérifiez le titre et la description."
    }, true)
  }

  /** Les règles métier refusées (400) renvoient un message français rédigé par l’API. */
  private async call<T>(request: () => Promise<T>, messages: Messages = {}, citizen = false): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (!(error instanceof ApiHttpError)) throw new AppError("NETWORK_ERROR", "Impossible de joindre le service. Vérifiez votre connexion puis réessayez.")
      if (error.status === 401) throw new AppError(401, "Votre session a expiré. Veuillez vous reconnecter.")
      if (citizen && error.status === 404 && !messages[404]) {
        throw new AppError(404, "Ce compte n’a pas d’espace citoyen : activez-le depuis « Mon espace » pour participer.", { code: NOT_CITIZEN })
      }
      const message = messages[error.status]
      if (message) throw new AppError(error.status, message)
      if (error.status === 400) throw new AppError(400, error.payload?.message ?? "La demande a été refusée.")
      if (error.status === 404) throw new AppError(404, "Élément introuvable.")
      throw new AppError(error.status, "Le service est momentanément indisponible. Réessayez dans quelques instants.")
    }
  }
}
