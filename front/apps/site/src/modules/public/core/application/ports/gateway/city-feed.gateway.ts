/**
 * Abonnement aux changements publiés par la ville (alertes, publications, désactivation d’un service — F63), sans rechargement.
 * Le message dit seulement ce qui a changé : l’écran recharge ses données depuis l’API
 * et garde un rafraîchissement périodique de secours.
 */
export const CITY_FEED_EVENTS = ["alert.published", "alert.withdrawn", "publication.published", "publication.important", "service.availability"] as const

export type CityFeedEventType = (typeof CITY_FEED_EVENTS)[number]

export type CityFeedEvent = { type: CityFeedEventType; id: string | null }

export interface CityFeedGateway {
  /** Retourne la fonction de désabonnement. Un seul flux est partagé par tous les abonnés. */
  subscribe(listener: (event: CityFeedEvent) => void): () => void
  /** Rouvre le flux après un changement de session (topics privés du citoyen connecté). */
  restart(): void
}
