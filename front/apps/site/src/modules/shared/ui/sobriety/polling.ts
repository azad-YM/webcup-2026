import { isLightModeActive } from "@boilerplate/shared-ui/a11y"
import { isRealtimeLive } from "../../core/lib/realtime-health"

/** Les mises à jour de secours sont quatre fois plus espacées en mode léger (F62). */
export const LIGHT_MODE_POLLING_FACTOR = 4
/** F95 : flux temps réel ouvert → le rafraîchissement de secours n’est plus qu’un filet (×5, soit 5 min pour 60 s). */
export const REALTIME_POLLING_FACTOR = 5

/**
 * Options de rafraîchissement de secours des requêtes RTK Query (L17, F58/F61) :
 * - pas d’appel tant que l’onglet est caché (`skipPollingIfUnfocused`, état tenu par `setupListeners`
 *   dans `StoreProvider`, qui suit `visibilitychange`) ;
 * - intervalle multiplié en mode léger, et quand le flux temps réel est ouvert (F95 : pas de requêtes en double).
 * Le temps réel (flux SSE unique) reste la source principale des mises à jour.
 */
export function polling(intervalMs: number) {
  return {
    pollingInterval: intervalMs * (isLightModeActive() ? LIGHT_MODE_POLLING_FACTOR : 1) * (isRealtimeLive() ? REALTIME_POLLING_FACTOR : 1),
    skipPollingIfUnfocused: true
  }
}
