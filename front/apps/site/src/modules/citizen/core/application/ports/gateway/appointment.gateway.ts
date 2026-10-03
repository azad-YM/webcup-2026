import type { Appointment, AppointmentChange, AppointmentOffer } from "../../../domain/appointment"

/** Contrat HTTP des rendez-vous du citoyen connecté (Citizen, L10). */
export interface AppointmentGateway {
  offer(token: string, serviceId: string | null): Promise<AppointmentOffer>
  listMine(token: string): Promise<Appointment[]>
  book(token: string, slotId: string): Promise<Appointment>
  change(token: string, change: AppointmentChange): Promise<Appointment>
}
