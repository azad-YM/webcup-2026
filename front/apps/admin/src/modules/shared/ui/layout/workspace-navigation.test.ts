import { describe, expect, it } from "vitest"
import { MODULE_NAVIGATION, moduleForPath } from "./workspace-navigation"
import { BREADCRUMB_LABELS } from "./breadcrumbs"

describe("Navigation de l’administration", () => {
  it("garde chaque écran existant accessible depuis une seule rubrique", () => {
    const routes = Object.values(MODULE_NAVIGATION).flatMap(groups => groups.flatMap(group => group.items.map(item => item.url)))
    expect(new Set(routes).size).toBe(routes.length)
    expect(routes.sort()).toEqual(Object.keys(BREADCRUMB_LABELS).filter(path => path !== "/espaces").sort())
  })
  it("conserve Administration actif dans les contenus de la ville", () => {
    expect(moduleForPath("/contenus/alertes")).toBe("admin")
    expect(moduleForPath("/admin/member")).toBe("admin")
  })
  it("ne confond pas un préfixe similaire avec un module", () => {
    expect(moduleForPath("/demandes/rendez-vous")).toBe("requests")
    expect(moduleForPath("/pilotage/tableau-de-bord")).toBe("pilotage")
    expect(moduleForPath("/demandes-inconnues")).toBeNull()
    expect(moduleForPath("/espaces")).toBeNull()
  })
})
