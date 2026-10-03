import type { AppointmentDay, SlotSeries } from "../../../domain/agent-desk"

/** Guichet des agents dans Citizen : rendez-vous du jour et créneaux (L10). */
export interface AgentDeskGateway {
  appointmentDay(date: string): Promise<AppointmentDay>
  openSlots(series: SlotSeries): Promise<void>
  removeSlot(slotId: string): Promise<void>
}
