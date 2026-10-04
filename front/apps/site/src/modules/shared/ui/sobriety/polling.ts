import { isLightModeActive } from "@boilerplate/shared-ui/a11y"

/** Les mises à jour de secours sont quatre fois plus espacées en mode léger (F62). */
export const LIGHT_MODE_POLLING_FACTOR = 4

/**
 * Options de rafraîchissement de secours des requêtes RTK Query (L17, F58/F61) :
 * - pas d’appel tant que l’onglet est caché (`skipPollingIfUnfocused`, état tenu par `setupListeners`
 *   dans `StoreProvider`, qui suit `visibilitychange`) ;
 * - intervalle multiplié en mode léger.
 * Le temps réel (flux SSE unique) reste la source principale des mises à jour.
 */
export function polling(intervalMs: number) {
  return {
    pollingInterval: isLightModeActive() ? intervalMs * LIGHT_MODE_POLLING_FACTOR : intervalMs,
    skipPollingIfUnfocused: true
  }
}
