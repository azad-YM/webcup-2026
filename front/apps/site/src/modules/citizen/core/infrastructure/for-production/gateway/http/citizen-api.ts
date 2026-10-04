import { ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"

const NETWORK_MESSAGE = "Impossible de joindre le service. Vérifiez votre connexion puis réessayez."
const UNAVAILABLE_MESSAGE = "Le service est momentanément indisponible. Réessayez dans quelques instants."

type Messages = Partial<Record<number, string>>

/** Message rédigé par l'API, en français, pour un refus qu'elle explique elle-même (F63, F69). */
export function apiExplanation(error: ApiHttpError): string | null {
  const payload = error.payload as { code?: string; message?: string; error?: string } | undefined
  // 409 `service_disabled` : service désactivé par la mairie ; 429 : trop de tentatives, avec le délai d'attente.
  if ((error.status === 409 && payload?.code === "service_disabled") || error.status === 429) {
    return payload?.message ?? payload?.error ?? "Trop de tentatives en peu de temps. Patientez quelques minutes avant de réessayer."
  }
  return null
}

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
    const explained = apiExplanation(error)
    if (explained) throw new AppError(error.status, explained)
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
