/**
 * Jeton de la session en cours, nécessaire aux appels authentifiés de Citizen.
 * Fourni par le module auth (`auth/core/infrastructure/adapter/citizen`).
 */
export interface CitizenSessionProvider {
  getToken(): string | null
}
