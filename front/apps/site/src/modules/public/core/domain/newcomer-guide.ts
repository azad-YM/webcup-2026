/**
 * F72 : orientation d’un nouvel arrivant, sans inscription. Quelques réponses simples
 * donnent une liste priorisée de services du catalogue et une check-list de premières démarches.
 * Les identifiants de services sont ceux du catalogue d’Administration ; un service absent est ignoré.
 */
export type Household = "alone" | "couple" | "children"
export type Need = "housing" | "health" | "work" | "transport" | "school"
export const NEEDS: Need[] = ["housing", "health", "work", "transport", "school"]

export type NewcomerAnswers = { household: Household | null; needs: Need[]; healthCare: boolean | null }

export type StepCode =
  | "census"
  | "account"
  | "profile"
  | "housing"
  | "school"
  | "doctor"
  | "transport"
  | "work"
  | "emergency"

export type GuideStep = { code: StepCode; href: string }

/** Services proposés, du plus prioritaire au moins prioritaire. */
export function recommendedServiceIds(answers: NewcomerAnswers): string[] {
  const ids = ["etat-civil"]
  const needs = new Set(answers.needs)
  if (needs.has("housing")) ids.push("logement")
  if (answers.healthCare || needs.has("health")) ids.push("sante", "pharmacie-de-garde")
  if (answers.household === "children" || needs.has("school")) ids.push("education")
  if (needs.has("transport")) ids.push("transports")
  ids.push("eau-energie", "proprete-recyclage")
  return [...new Set(ids)]
}

/** Premières démarches, dans l’ordre conseillé ; le compte n’est proposé qu’aux visiteurs non connectés. */
export function firstSteps(answers: NewcomerAnswers, connected: boolean): GuideStep[] {
  const needs = new Set(answers.needs)
  const steps: GuideStep[] = [{ code: "census", href: "/services?service=etat-civil" }]
  steps.push(connected ? { code: "profile", href: "/espace/profil" } : { code: "account", href: "/inscription" })
  if (needs.has("housing")) steps.push({ code: "housing", href: "/services?service=logement" })
  if (answers.household === "children" || needs.has("school")) steps.push({ code: "school", href: "/services?service=education" })
  if (answers.healthCare || needs.has("health")) steps.push({ code: "doctor", href: "/services?service=sante" })
  if (needs.has("transport")) steps.push({ code: "transport", href: "/services?service=transports" })
  if (needs.has("work")) steps.push({ code: "work", href: connected ? "/espace/rendez-vous" : "/services?service=etat-civil" })
  steps.push({ code: "emergency", href: "/urgences" })
  return steps
}

export const isComplete = (answers: NewcomerAnswers) => answers.household !== null && answers.healthCare !== null
