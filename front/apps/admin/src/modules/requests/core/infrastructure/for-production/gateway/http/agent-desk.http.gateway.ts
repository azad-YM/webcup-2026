import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { RequestsError } from "../../../../application/errors/requests.error"
import type { AgentDeskGateway } from "../../../../application/ports/gateway/agent-desk.gateway"
import type { RequestSessionProvider } from "../../../../application/ports/provider/request-session.provider"
import type { AppointmentDay, ConcernHandling, ConcernQueue, ConcernStatus, SlotSeries } from "../../../../domain/agent-desk"

/** `GET /citizen/agent/appointments?date=`, `POST /citizen/agent/appointment-slots[/remove]`. */
export class AgentDeskHttpGateway extends ApiClient implements AgentDeskGateway {
  constructor(baseUrl: string, private readonly session: RequestSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  appointmentDay(date: string, reveal = false): Promise<AppointmentDay> {
    return this.call(() => this.getAuth<AppointmentDay>(`/citizen/agent/appointments?date=${encodeURIComponent(date)}${reveal ? "&reveal=1" : ""}`))
  }

  async openSlots(series: SlotSeries): Promise<void> {
    await this.call(() => this.postAuth<unknown>("/citizen/agent/appointment-slots", series))
  }

  async removeSlot(slotId: string): Promise<void> {
    await this.call(() => this.postAuth<unknown>("/citizen/agent/appointment-slots/remove", { slotId }))
  }

  concernQueue(status: ConcernStatus | null): Promise<ConcernQueue> {
    return this.call(() => this.getAuth<ConcernQueue>(`/citizen/agent/concerns${status ? `?status=${status}` : ""}`))
  }

  async handleConcern(handling: ConcernHandling): Promise<void> {
    await this.call(() => this.postAuth<unknown>("/citizen/agent/concerns/handle", handling))
  }

  private async call<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (error instanceof ApiHttpError) {
        if (error.status === 401) {
          this.session.invalidate()
          throw new RequestsError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
        }
        if (error.status === 403) throw new RequestsError("forbidden", "Votre compte n’a pas accès au guichet des rendez-vous (permissions admin.request.read et admin.request.write).")
        if (error.status === 409) throw new RequestsError("conflict", "Ce créneau est réservé par un habitant : il ne peut pas être retiré.")
        if (error.status === 404) throw new RequestsError("conflict", "Ce créneau n’existe plus. La liste a été actualisée.")
        if (error.status === 422 || error.status === 400) throw new RequestsError("invalid", "Informations refusées : vérifiez les champs (créneau : service, date et heure à venir, durée de 5 à 240 min, lieu ; inquiétude : une réponse est obligatoire).")
      }
      throw new RequestsError("unavailable", "Le service est indisponible. Réessayez dans quelques instants.")
    }
  }
}
