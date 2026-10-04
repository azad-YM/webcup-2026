import type { UseCase } from "@/modules/shared/core/config/use-cases"
import { tokenExpiry } from "../../domain/session-expiry"

/** F69 : date d’expiration (ms) de la session admin, lue dans le jeton ; null si inconnue. */
export const getSessionExpiry: UseCase<void, number | null> = async (_dispatch, _getState, dependencies) =>
  tokenExpiry(dependencies.authSessionGateway.getToken())
