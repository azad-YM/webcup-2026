import type { UnknownAction } from "@reduxjs/toolkit"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { RealtimeNotification } from "@/modules/shared/core/application/ports/realtime-subscriber"

type CacheLifecycle = {
  extra: unknown
  dispatch: (action: UnknownAction) => unknown
  cacheDataLoaded: Promise<unknown>
  cacheEntryRemoved: Promise<void>
}

/**
 * `onCacheEntryAdded` commun : tant qu'un écran affiche la donnée, les événements listés de l'unique flux
 * temps réel de l'onglet déclenchent `onEvent` (en général une invalidation RTK Query). Le `pollingInterval`
 * de l'écran reste le filet de sécurité.
 */
export const followRealtime =
  (eventTypes: readonly string[], onEvent: (dispatch: (action: UnknownAction) => unknown, event: RealtimeNotification) => void) =>
  async (_arg: unknown, { extra, dispatch, cacheDataLoaded, cacheEntryRemoved }: CacheLifecycle) => {
    let unsubscribe: () => void = () => undefined
    try {
      await cacheDataLoaded
      unsubscribe = (extra as Dependencies).realtime.subscribe(eventTypes, (event) => onEvent(dispatch, event))
    } catch {
      /* Chargement en échec : pas d'abonnement, le polling et « Réessayer » prennent le relais. */
    }
    await cacheEntryRemoved
    unsubscribe()
  }
