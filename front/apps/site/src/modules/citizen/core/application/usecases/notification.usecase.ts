import { AppError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { NotificationInbox } from "../../domain/notification"

export const requireToken = (token: string | null) => {
  if (!token) throw new AppError(401, "Veuillez vous connecter.")
  return token
}

export const listMyNotifications: UseCase<void, NotificationInbox> = async (dependencies) =>
  dependencies.notificationGateway.list(requireToken(dependencies.citizenSessionProvider.getToken()))

export const markNotificationsRead: UseCase<string[], null> = async (dependencies, ids) => {
  await dependencies.notificationGateway.markRead(requireToken(dependencies.citizenSessionProvider.getToken()), ids)
  return null
}
