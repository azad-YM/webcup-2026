import type { CreateItemPayload, UpdateItemPayload } from "../../application/dto/item.dto"
import { ExampleError } from "../../application/errors/example.error"
import type { ItemGateway } from "../../application/ports/gateway/item.gateway"
import { isDuplicateItemName, type Item } from "../../domain/item"

/** Test double reproducing the server rules that matter to the UI. */
export class InMemoryItemGateway implements ItemGateway {
  private sequence = 0

  constructor(public items: Item[] = []) {}

  async list(): Promise<Item[]> {
    return [...this.items].sort((a, b) => a.name.localeCompare(b.name))
  }

  async create(payload: CreateItemPayload): Promise<Item> {
    this.assertUnique(payload.name)
    const item: Item = { id: `item-${++this.sequence}`, ...payload, status: "active", createdAt: "2026-01-01T00:00:00+00:00" }
    this.items.push(item)
    return item
  }

  async update(payload: UpdateItemPayload): Promise<Item> {
    const current = this.find(payload.id)
    this.assertUnique(payload.name, payload.id)
    const item = { ...current, ...payload }
    this.items = this.items.map((existing) => existing.id === item.id ? item : existing)
    return item
  }

  async remove(id: string): Promise<void> {
    this.find(id)
    this.items = this.items.filter((item) => item.id !== id)
  }

  private find(id: string): Item {
    const item = this.items.find((existing) => existing.id === id)
    if (!item) throw new ExampleError("not-found", "Cet élément n’existe plus. Actualisez la liste.")
    return item
  }

  private assertUnique(name: string, ignoredId?: string): void {
    if (isDuplicateItemName(this.items, name, ignoredId)) throw new ExampleError("invalid", "An item with this name already exists.")
  }
}
