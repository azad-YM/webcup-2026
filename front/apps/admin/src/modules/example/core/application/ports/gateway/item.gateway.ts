import type { Item } from "../../../domain/item"
import type { CreateItemPayload, UpdateItemPayload } from "../../dto/item.dto"

export interface ItemGateway {
  list(): Promise<Item[]>
  create(payload: CreateItemPayload): Promise<Item>
  update(payload: UpdateItemPayload): Promise<Item>
  remove(id: string): Promise<void>
}
