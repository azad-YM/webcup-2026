import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { AccountRegistrationGateway } from "@/modules/auth/core/application/ports/gateway/account-registration.gateway"
import { RegistrationErrorCode, type RegistrationPayload } from "@/modules/auth/core/application/dto/auth.dto"
import { CitizenErrorCode, type CitizenGateway } from "../../../application/ports/gateway/citizen.gateway"

/**
 * Adaptateur fournisseur : le module citizen implémente le port d’inscription
 * du module auth en créant un compte citoyen, et traduit ses erreurs vers le
 * contrat d’auth.
 */
export class CitizenAccountRegistrationAdapter implements AccountRegistrationGateway {
  constructor(private readonly citizenGateway: CitizenGateway) {}

  async register(payload: RegistrationPayload): Promise<void> {
    try {
      await this.citizenGateway.register(payload)
    } catch (error) {
      if (!(error instanceof AppError)) throw error
      const code = error.details.code === CitizenErrorCode.emailAlreadyUsed
        ? RegistrationErrorCode.accountAlreadyExists
        : error.details.code === CitizenErrorCode.invalidPayload
          ? RegistrationErrorCode.invalidRegistration
          : undefined
      throw new AppError(error.status, error.message, { code, field: error.details.field })
    }
  }
}
