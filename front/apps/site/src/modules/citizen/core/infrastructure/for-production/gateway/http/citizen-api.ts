import { ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"

const NETWORK_MESSAGE = "Impossible de joindre le service. Vérifiez votre connexion puis réessayez."
const UNAVAILABLE_MESSAGE = "Le service est momentanément indisponible. Réessayez dans quelques instants."

type Messages = Partial<Record<number, string>>

/**
 * Traduction commune des erreurs HTTP de Citizen en `AppError` affichables (notifications, rendez-vous,
 * participation). Le message de l'API (`error` d'une règle métier) est repris pour un 409/422 sans message dédié.
 */
export async function callCitizenApi<T>(request: () => Promise<T>, messages: Messages = {}): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (!(error instanceof ApiHttpError)) throw new AppError("NETWORK_ERROR", NETWORK_MESSAGE)
    if (error.status === 401) throw new AppError(401, "Votre session a expiré. Veuillez vous reconnecter.")
    const message = messages[error.status]
    if (message) throw new AppError(error.status, message)
    if (error.status === 404) throw new AppError(404, "Élément introuvable dans votre espace.")
    if (error.status === 403) throw new AppError(403, "Vous n’avez pas accès à cette action.")
    if (error.status === 409 || error.status === 422 || error.status === 400) {
      throw new AppError(error.status, "La demande n’a pas pu être enregistrée. Vérifiez les informations puis réessayez.")
    }
    throw new AppError(error.status, UNAVAILABLE_MESSAGE)
  }
}
