import type { AppointmentDay, ConcernHandling, ConcernQueue, ConcernStatus, SlotSeries } from "../../../domain/agent-desk"

/** Guichet des agents dans Citizen : rendez-vous du jour et créneaux (L10), inquiétudes des habitants (L14). */
export interface AgentDeskGateway {
  appointmentDay(date: string, reveal?: boolean): Promise<AppointmentDay>
  openSlots(series: SlotSeries): Promise<void>
  removeSlot(slotId: string): Promise<void>
  concernQueue(status: ConcernStatus | null): Promise<ConcernQueue>
  handleConcern(handling: ConcernHandling): Promise<void>
}
