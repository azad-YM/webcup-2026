import { describe, expect, it } from "vitest"
import { DEMO_PUBLICATIONS, DEMO_SERVICES } from "../infrastructure/for-production/gateway/local/demo-content"
import { featuredServices, filterServices, findService, isServiceCategory, SERVICE_CATEGORIES } from "./municipal-service"
import { findPublication, formatPublicationDate, latestPublications } from "./publication"

describe("Services municipaux — recherche et mise en avant", () => {
  it("cherche sans tenir compte des accents ni de la casse, y compris dans les mots-clés", () => {
    expect(filterServices(DEMO_SERVICES, { query: "SANTE" }).map((s) => s.id)).toEqual(["sante"])
    expect(filterServices(DEMO_SERVICES, { query: "lampadaire" }).map((s) => s.id)).toEqual(["voirie-eclairage"])
    expect(filterServices(DEMO_SERVICES, { query: "  " })).toHaveLength(DEMO_SERVICES.length)
  })
  it("combine recherche et catégorie", () => {
    const cadreDeVie = filterServices(DEMO_SERVICES, { category: "cadre-de-vie" })
    expect(cadreDeVie.every((s) => s.category === "cadre-de-vie")).toBe(true)
    expect(filterServices(DEMO_SERVICES, { category: "cadre-de-vie", query: "eau" }).map((s) => s.id)).toEqual(["eau-energie"])
    expect(filterServices(DEMO_SERVICES, { category: "mobilite", query: "eau" })).toEqual([])
  })
  it("met en avant les services prioritaires", () => {
    expect(featuredServices(DEMO_SERVICES).map((s) => s.id)).toEqual(["etat-civil", "sante", "voirie-eclairage", "transports"])
  })
  it("retrouve un service et valide une catégorie d’URL", () => {
    expect(findService(DEMO_SERVICES, "logement")?.name).toBe("Logement")
    expect(findService(DEMO_SERVICES, "inconnu")).toBeNull()
    expect(isServiceCategory("mobilite")).toBe(true)
    expect(isServiceCategory("toString")).toBe(false)
  })
})

describe("Publications", () => {
  it("présente les plus récentes en premier", () => {
    expect(latestPublications(DEMO_PUBLICATIONS, 2).map((p) => p.id)).toEqual(["centre-sante-aurore", "travaux-avenue-pionniers"])
    expect(findPublication(DEMO_PUBLICATIONS, "accueil-nouveaux-arrivants")?.category).toBe("Vie municipale")
  })
  it("affiche la date en français", () => {
    expect(formatPublicationDate("2026-10-02T09:00:00+00:00")).toBe("2 octobre 2026")
  })
})

describe("Contenu de démonstration (adaptateur local)", () => {
  it("propose 6 à 8 services et 3 actualités cohérents", () => {
    expect(DEMO_SERVICES.length).toBeGreaterThanOrEqual(6)
    expect(DEMO_SERVICES.length).toBeLessThanOrEqual(8)
    expect(new Set(DEMO_SERVICES.map((s) => s.id)).size).toBe(DEMO_SERVICES.length)
    expect(DEMO_SERVICES.every((s) => s.category in SERVICE_CATEGORIES && s.actions.length > 0)).toBe(true)
    expect(DEMO_PUBLICATIONS).toHaveLength(3)
  })
})
