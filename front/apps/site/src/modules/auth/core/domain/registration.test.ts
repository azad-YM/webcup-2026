import { describe, expect, it } from "vitest"
import { hasErrors, validateRegistration } from "./registration"
import { safeReturnPath } from "./return-path"

const valid = { email: "ada@nova-terra.fr", password: "motdepasse", confirmation: "motdepasse" }

describe("Inscription — règles de saisie", () => {
  it("accepte une saisie complète", () => {
    expect(hasErrors(validateRegistration(valid))).toBe(false)
  })
  it("exige une adresse e-mail valide", () => {
    expect(validateRegistration({ ...valid, email: " " }).email).toBe("Indiquez votre adresse e-mail.")
    expect(validateRegistration({ ...valid, email: "ada@" }).email).toMatch(/n’est pas valide/)
  })
  it("impose 8 à 72 octets pour le mot de passe", () => {
    expect(validateRegistration({ ...valid, password: "court", confirmation: "court" }).password).toMatch(/au moins 8/)
    const long = "é".repeat(37) // 74 octets en UTF-8
    expect(validateRegistration({ ...valid, password: long, confirmation: long }).password).toMatch(/trop long/)
    const max = "a".repeat(72)
    expect(validateRegistration({ ...valid, password: max, confirmation: max }).password).toBeUndefined()
  })
  it("vérifie la confirmation", () => {
    expect(validateRegistration({ ...valid, confirmation: "autre-chose" }).confirmation).toBe("Les deux mots de passe ne correspondent pas.")
    expect(validateRegistration({ ...valid, confirmation: "" }).confirmation).toBe("Confirmez votre mot de passe.")
  })
})

describe("Destination après connexion", () => {
  it("n’accepte que les pages connues du site", () => {
    expect(safeReturnPath("/espace/profil")).toBe("/espace/profil")
    expect(safeReturnPath("/espace/profil/")).toBe("/espace/profil")
    expect(safeReturnPath("https://exemple.com")).toBe("/espace")
    expect(safeReturnPath("//exemple.com")).toBe("/espace")
    expect(safeReturnPath(null)).toBe("/espace")
  })
})
