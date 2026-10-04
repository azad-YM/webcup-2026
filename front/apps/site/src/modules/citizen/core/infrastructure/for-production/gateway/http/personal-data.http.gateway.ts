import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { PersonalDataGateway } from "../../../../application/ports/gateway/personal-data.gateway"
import type { IdentityProof, PersonalDataExport } from "../../../../domain/personal-data"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import { callCitizenApi } from "./citizen-api"

/** `POST /citizen/me/personal-data` : la confirmation voyage dans le corps de la requête, jamais dans l’URL. */
export class PersonalDataHttpGateway extends ApiClient implements PersonalDataGateway {
  async export(token: string, proof: IdentityProof): Promise<PersonalDataExport> {
    try {
      return await this.post<PersonalDataExport>("/citizen/me/personal-data", proof, ApiClient.authHeaders(token))
    } catch (error) {
      const payload = error instanceof ApiHttpError ? (error.payload ?? {}) as { code?: unknown; error?: unknown } : {}
      if (error instanceof ApiHttpError && error.status !== 401 && typeof payload.code === "string" && typeof payload.error === "string") {
        throw new AppError(error.status, payload.error, { code: payload.code })
      }
      return callCitizenApi(() => Promise.reject(error), { 404: "Seul un compte citoyen peut exporter ses données." })
    }
  }
}
