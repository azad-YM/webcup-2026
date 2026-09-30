import { describe, expect, it } from "vitest"
import { isDuplicateItemName, itemStatusLabel, type Item } from "./item"

const item = (id: string, name: string): Item => ({ id, name, description: "", status: "active", createdAt: "2026-01-01T00:00:00+00:00" })

describe("item rules", () => {
  it("detects duplicate names regardless of case and surrounding spaces", () => {
    expect(isDuplicateItemName([item("a", "Premier")], "  PREMIER ")).toBe(true)
    expect(isDuplicateItemName([item("a", "Premier")], "Second")).toBe(false)
  })

  it("ignores the item being edited", () => {
    expect(isDuplicateItemName([item("a", "Premier")], "premier", "a")).toBe(false)
  })

  it("labels statuses in French", () => {
    expect(itemStatusLabel("active")).toBe("Actif")
    expect(itemStatusLabel("archived")).toBe("Archivé")
  })
})
