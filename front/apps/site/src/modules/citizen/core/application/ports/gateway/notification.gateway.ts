import type { NotificationInbox } from "../../../domain/notification"

/** Contrat HTTP du centre de notifications du citoyen connecté (Citizen, F49). */
export interface NotificationGateway {
  list(token: string): Promise<NotificationInbox>
  /** `ids` vide : toutes les notifications non lues. */
  markRead(token: string, ids: string[]): Promise<void>
}
