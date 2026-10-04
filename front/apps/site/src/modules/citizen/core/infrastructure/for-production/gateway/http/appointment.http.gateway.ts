import { ApiClient } from "@boilerplate/shared-utils/api-client"
import type { AppointmentGateway } from "../../../../application/ports/gateway/appointment.gateway"
import type { Appointment, AppointmentChange, AppointmentOffer } from "../../../../domain/appointment"
import { callCitizenApi } from "./citizen-api"

const SLOT_TAKEN = "Ce créneau vient d’être pris ou n’est plus modifiable. Choisissez un autre créneau."

/** `GET /citizen/appointments/slots`, `GET|POST /citizen/appointments`, `POST /citizen/appointments/change`. */
export class AppointmentHttpGateway extends ApiClient implements AppointmentGateway {
  offer(token: string, serviceId: string | null): Promise<AppointmentOffer> {
    const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : ""
    return callCitizenApi(() => this.get<AppointmentOffer>(`/citizen/appointments/slots${query}`, ApiClient.authHeaders(token)))
  }

  async listMine(token: string): Promise<Appointment[]> {
    const body = await callCitizenApi(() => this.get<{ items: Appointment[] }>("/citizen/appointments", ApiClient.authHeaders(token)), {
      404: "Les rendez-vous sont réservés aux comptes citoyens."
    })
    return body.items
  }

  book(token: string, slotId: string): Promise<Appointment> {
    return callCitizenApi(() => this.post<Appointment>("/citizen/appointments", { slotId }, ApiClient.authHeaders(token)), {
      404: "Ce créneau n’existe plus. Choisissez un autre créneau.",
      409: SLOT_TAKEN
    })
  }

  change(token: string, change: AppointmentChange): Promise<Appointment> {
    return callCitizenApi(() => this.post<Appointment>("/citizen/appointments/change", change, ApiClient.authHeaders(token)), {
      404: "Ce rendez-vous ou ce créneau est introuvable.",
      409: SLOT_TAKEN
    })
  }
}
