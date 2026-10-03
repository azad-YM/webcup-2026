import { describe, expect, it } from "vitest"
import { greeting, isProfileCompleted, normalizeDraft, toDraft, validateProfile, type CitizenProfile } from "./citizen-profile"

const empty: CitizenProfile = {
  id: "c-1", firstName: null, lastName: null, phone: null, address: null, district: null,
  preferredLanguage: null, registeredAt: "2026-10-03T14:30:00+00:00", profileCompleted: false
}

describe("Profil citoyen — règles", () => {
  it("transforme les champs vides en null et retire les espaces superflus", () => {
    const draft = { ...toDraft(empty), firstName: "  Ada  ", lastName: "", district: "Quartier   Aurore" }
    expect(normalizeDraft(draft)).toEqual({
      firstName: "Ada", lastName: null, phone: null, address: null, district: "Quartier Aurore", preferredLanguage: null
    })
  })
  it("signale les champs trop longs", () => {
    const errors = validateProfile({ ...toDraft(empty), firstName: "a".repeat(101), address: "b".repeat(255) })
    expect(errors.firstName).toMatch(/100 caractères/)
    expect(errors.address).toBeUndefined()
  })
  it("contrôle le format du téléphone et la langue", () => {
    expect(validateProfile({ ...toDraft(empty), phone: "+33 6 12 34 56 78" }).phone).toBeUndefined()
    expect(validateProfile({ ...toDraft(empty), phone: "appelez-moi" }).phone).toBeDefined()
    expect(validateProfile({ ...toDraft(empty), preferredLanguage: "es" }).preferredLanguage).toBeUndefined()
    expect(validateProfile({ ...toDraft(empty), preferredLanguage: "fr-FR-x" }).preferredLanguage).toMatch(/5 caractères/)
  })
  it("considère le profil complété avec prénom, nom et quartier", () => {
    expect(isProfileCompleted(empty)).toBe(false)
    expect(isProfileCompleted({ firstName: "Ada", lastName: "Lovelace", district: null })).toBe(false)
    expect(isProfileCompleted({ firstName: "Ada", lastName: "Lovelace", district: "Aurore" })).toBe(true)
  })
  it("salue le citoyen par son prénom quand il est connu", () => {
    expect(greeting(empty)).toBe("Bonjour")
    expect(greeting({ firstName: "Ada" })).toBe("Bonjour Ada")
  })
})
