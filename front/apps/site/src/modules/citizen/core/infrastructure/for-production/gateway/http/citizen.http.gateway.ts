import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import {
  CitizenErrorCode,
  type CitizenGateway,
  type CitizenRegistration
} from "../../../../application/ports/gateway/citizen.gateway"
import {
  PROFILE_FIELDS,
  PROFILE_LABELS,
  type CitizenProfile,
  type CitizenProfileUpdate,
  type ProfileField
} from "../../../../domain/citizen-profile"

const NETWORK_MESSAGE = "Impossible de joindre le service. Vérifiez votre connexion puis réessayez."
const UNAVAILABLE_MESSAGE = "Le service est momentanément indisponible. Réessayez dans quelques instants."

type Operation = "register" | "profile" | "delete"

/** Retrouve le champ visé par une erreur 422 (`{ path, message }`). */
function fieldFromPath(path: string | undefined): string | undefined {
  if (!path) return undefined
  const known = [...PROFILE_FIELDS, "email", "password"]
  return known.find((field) => path.replace(/[[\]]/g, "").split(/[.]/).includes(field))
}

/**
 * Adaptateur HTTP du contrat Citizen (lot L1) :
 * `POST /citizen/register`, `GET /citizen/me`, `PUT /citizen/me`,
 * `POST /citizen/me/activate`.
 * Les messages techniques de l’API ne sont jamais affichés.
 */
export class CitizenHttpGateway extends ApiClient implements CitizenGateway {
  private async execute<T>(operation: Operation, request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (!(error instanceof ApiHttpError)) throw new AppError("NETWORK_ERROR", NETWORK_MESSAGE)
      throw this.translate(operation, error)
    }
  }

  private translate(operation: Operation, error: ApiHttpError): AppError {
    const field = fieldFromPath(error.payload?.path)
    switch (error.status) {
      case 401:
        return new AppError(401, "Votre session a expiré. Veuillez vous reconnecter.")
      case 404:
        return new AppError(404, "Ce compte n’est pas un compte citoyen.", { code: CitizenErrorCode.notCitizen })
      case 403:
        return new AppError(403, "Mot de passe incorrect. La suppression a été refusée.")
      case 409:
        if (operation === "delete") return new AppError(409, "Ce compte est aussi un compte d’agent actif. Contactez un administrateur avant de le supprimer.")
        return new AppError(409, "Un compte existe déjà avec cet e-mail.", { code: CitizenErrorCode.emailAlreadyUsed })
      case 422:
        if (operation === "register") {
          return new AppError(422, field === "password"
            ? "Ce mot de passe n’est pas accepté. Choisissez un mot de passe de 8 à 72 caractères."
            : field === "email"
              ? "Cette adresse e-mail n’est pas acceptée. Vérifiez sa saisie."
              : "Les informations saisies ne sont pas acceptées. Vérifiez l’adresse e-mail et choisissez un mot de passe de 8 à 72 caractères.",
          { code: CitizenErrorCode.invalidPayload, field })
        }
        return new AppError(422, field && field in PROFILE_LABELS
          ? `${PROFILE_LABELS[field as ProfileField]} : cette valeur n’est pas acceptée. Vérifiez la saisie.`
          : "Certaines informations ne sont pas acceptées. Vérifiez la saisie.",
        { code: CitizenErrorCode.invalidPayload, field })
      case 400:
        return new AppError(400, "Certaines informations ne sont pas acceptées. Vérifiez la saisie.", { code: CitizenErrorCode.invalidPayload })
      default:
        return new AppError(error.status, UNAVAILABLE_MESSAGE)
    }
  }

  deleteMyAccount(token: string, password: string): Promise<{ deleted: boolean }> {
    return this.execute("delete", () => this.delete<{ deleted: boolean }>("/citizen/me", ApiClient.authHeaders(token), { password }))
  }

  register(payload: CitizenRegistration): Promise<{ citizenId: string }> {
    return this.execute("register", () =>
      this.post<{ citizenId: string }>("/citizen/register", { email: payload.email, password: payload.password }))
  }

  getMyProfile(token: string): Promise<CitizenProfile> {
    return this.execute("profile", () => this.get<CitizenProfile>("/citizen/me", ApiClient.authHeaders(token)))
  }

  updateMyProfile(token: string, update: CitizenProfileUpdate): Promise<CitizenProfile> {
    const body = Object.fromEntries(PROFILE_FIELDS.map((field) => [field, update[field]]))
    return this.execute("profile", () => this.put<CitizenProfile>("/citizen/me", body, ApiClient.authHeaders(token)))
  }

  listDistricts(): Promise<string[]> {
    return this.execute("profile", () => this.get<string[]>("/administration/districts"))
  }

  activateMyCitizenAccount(token: string): Promise<CitizenProfile> {
    return this.execute("profile", () => this.post<CitizenProfile>("/citizen/me/activate", {}, ApiClient.authHeaders(token)))
  }
}
