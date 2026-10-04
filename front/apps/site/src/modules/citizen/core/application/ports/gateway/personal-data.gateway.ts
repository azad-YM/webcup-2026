import type { IdentityProof, PersonalDataExport } from "../../../domain/personal-data"

/**
 * F55 — export des données personnelles (Citizen). Erreurs : `AppError` avec le message rédigé par l’API
 * (mot de passe ou code incorrect, code expiré, trop d’essais) et `details.code`.
 */
export interface PersonalDataGateway {
  export(token: string, proof: IdentityProof): Promise<PersonalDataExport>
}
