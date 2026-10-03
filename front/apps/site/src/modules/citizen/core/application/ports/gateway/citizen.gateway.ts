import type { CitizenProfile, CitizenProfileUpdate } from "../../../domain/citizen-profile"

export type CitizenRegistration = { email: string; password: string }

/** Codes d’erreur contractuels de Citizen, exposés dans `AppError.details.code`. */
export const CitizenErrorCode = {
  emailAlreadyUsed: "EMAIL_ALREADY_USED",
  invalidPayload: "INVALID_PAYLOAD",
  notCitizen: "NOT_CITIZEN"
} as const

/**
 * Accès au BC Citizen (contrat HTTP du lot L1).
 * Les erreurs sont des `AppError` : statut HTTP (401, 404, 409, 422…) ou
 * `NETWORK_ERROR`, message français affichable, `details.field` pour un 422.
 */
export interface CitizenGateway {
  register(payload: CitizenRegistration): Promise<{ citizenId: string }>
  getMyProfile(token: string): Promise<CitizenProfile>
  updateMyProfile(token: string, update: CitizenProfileUpdate): Promise<CitizenProfile>
  /** Rend citoyen le compte connecté (ex. agent) ; idempotent. */
  activateMyCitizenAccount(token: string): Promise<CitizenProfile>
  /** Liste fermée des quartiers, gérée par Administration (`GET /administration/districts`). */
  listDistricts(): Promise<string[]>
}
