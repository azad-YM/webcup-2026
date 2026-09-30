import { describe, expect, it } from "vitest"
import { createStore } from "@/modules/shared/core/config/store"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import { sessionCleared } from "@/modules/shared/core/config/session"
import { InMemoryItemGateway } from "../../infrastructure/for-tests/item.in-memory.gateway"
import { itemApi } from "../rtk-api/item"

const setup = () => {
  const itemGateway = new InMemoryItemGateway()
  const store = createStore({ dependencies: { itemGateway } as unknown as Dependencies })
  return { itemGateway, store }
}

describe("item use cases through RTK Query", () => {
  it("creates, lists, updates and deletes items with trimmed input", async () => {
    const { store, itemGateway } = setup()
    const created = await store.dispatch(itemApi.endpoints.createItem.initiate({ name: "  Premier  ", description: "  Détail " })).unwrap()
    expect(created).toMatchObject({ name: "Premier", description: "Détail", status: "active" })

    await store.dispatch(itemApi.endpoints.updateItem.initiate({ id: created.id, name: "Renommé", description: "", status: "archived" })).unwrap()
    const list = await store.dispatch(itemApi.endpoints.listItems.initiate(undefined, { subscribe: false })).unwrap()
    expect(list).toEqual([expect.objectContaining({ name: "Renommé", status: "archived" })])

    await store.dispatch(itemApi.endpoints.deleteItem.initiate({ id: created.id })).unwrap()
    expect(itemGateway.items).toEqual([])
  })

  it("surfaces gateway errors to the UI", async () => {
    const { store } = setup()
    await store.dispatch(itemApi.endpoints.createItem.initiate({ name: "Premier", description: "" })).unwrap()
    await expect(store.dispatch(itemApi.endpoints.createItem.initiate({ name: "PREMIER", description: "" })).unwrap()).rejects.toBeDefined()
  })

  it("clears cached items when the session changes", async () => {
    const { store } = setup()
    await store.dispatch(itemApi.endpoints.createItem.initiate({ name: "Premier", description: "" })).unwrap()
    const query = store.dispatch(itemApi.endpoints.listItems.initiate())
    await query.unwrap()
    expect(itemApi.endpoints.listItems.select()(store.getState()).data).toHaveLength(1)
    store.dispatch(sessionCleared())
    expect(itemApi.endpoints.listItems.select()(store.getState()).data).toBeUndefined()
    query.unsubscribe()
  })
})
