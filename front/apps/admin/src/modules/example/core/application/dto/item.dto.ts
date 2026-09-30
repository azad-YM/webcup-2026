import type { ItemStatus } from "../../domain/item"

export type CreateItemPayload = {
  name: string
  description: string
}

export type UpdateItemPayload = CreateItemPayload & {
  id: string
  status: ItemStatus
}
