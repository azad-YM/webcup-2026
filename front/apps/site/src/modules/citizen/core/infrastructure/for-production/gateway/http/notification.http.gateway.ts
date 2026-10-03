import { ApiClient } from "@boilerplate/shared-utils/api-client"
import type { NotificationGateway } from "../../../../application/ports/gateway/notification.gateway"
import type { NotificationInbox } from "../../../../domain/notification"
import { callCitizenApi } from "./citizen-api"

/** `GET /citizen/notifications`, `POST /citizen/notifications/read`. */
export class NotificationHttpGateway extends ApiClient implements NotificationGateway {
  list(token: string): Promise<NotificationInbox> {
    return callCitizenApi(() => this.get<NotificationInbox>("/citizen/notifications", ApiClient.authHeaders(token)))
  }

  async markRead(token: string, ids: string[]): Promise<void> {
    await callCitizenApi(() => this.post<unknown>("/citizen/notifications/read", { ids }, ApiClient.authHeaders(token)))
  }
}
