/** Notifications de l'espace citoyen (F49, F40, F51) : contrat de Citizen, voir `api/src/Citizen/doc/notifications.md`. */
export type NotificationKind = "request.status_changed" | "appointment.reminder" | "concern.updated" | "security.new_device"

export type CitizenNotification = {
  id: string
  kind: NotificationKind
  title: string
  message: string
  link: string | null
  createdAt: string
  readAt: string | null
}

export type NotificationInbox = { items: CitizenNotification[]; unreadCount: number }

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  "request.status_changed": "Demande",
  "appointment.reminder": "Rendez-vous",
  "concern.updated": "Inquiétude",
  "security.new_device": "Sécurité"
}

/** Non lues d'un type donné (pastille sur un raccourci de l'espace). */
export const unreadOfKind = (inbox: NotificationInbox | undefined, kind: NotificationKind) =>
  inbox?.items.filter((item) => item.kind === kind && !item.readAt).length ?? 0

/** Le lien vient de l'API : seul un chemin interne du site est suivi. */
export const safeLink = (link: string | null) => (link && link.startsWith("/") && !link.startsWith("//") ? link : null)
