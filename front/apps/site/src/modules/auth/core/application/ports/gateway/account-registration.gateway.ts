import type { RegistrationPayload } from "../../dto/auth.dto"

/**
 * Port de création de compte, défini par le module auth (consommateur).
 * Fourni par le module citizen (`citizen/core/infrastructure/adapter/auth`),
 * qui crée le compte et le citoyen (`POST /api/citizen/register`).
 *
 * Erreurs contractuelles : `AppError` avec le statut HTTP et
 * `details.code` pris dans `RegistrationErrorCode` (409, 422),
 * ou le statut `NETWORK_ERROR` pour une panne réseau.
 */
export interface AccountRegistrationGateway {
  register(payload: RegistrationPayload): Promise<void>
}
