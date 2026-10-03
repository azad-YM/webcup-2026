import { describe, expect, it } from "vitest"
import { isCurrentSection, normalizePath } from "./navigation"

describe("Navigation principale", () => {
  it("ignore la barre oblique finale de l’export statique", () => {
    expect(normalizePath("/services/")).toBe("/services")
    expect(normalizePath("/")).toBe("/")
    expect(normalizePath(null)).toBe("/")
  })
  it("signale la rubrique courante, y compris sur ses sous-pages", () => {
    expect(isCurrentSection("/", "/")).toBe(true)
    expect(isCurrentSection("/services/", "/")).toBe(false)
    expect(isCurrentSection("/services/", "/services")).toBe(true)
    expect(isCurrentSection("/espace/profil/", "/espace")).toBe(true)
    expect(isCurrentSection("/espaces", "/espace")).toBe(false)
  })
})
