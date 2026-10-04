/**
 * Abonnement au flux temps réel du site (ADR 004) : un seul flux SSE par onglet, partagé par tous les modules
 * (`citizen` pour les demandes et notifications, `public` pour les alertes et publications, via son port
 * `CityFeedGateway`). Les topics sont décidés par le serveur selon le compte connecté ; l'écran ne reçoit que
 * des identifiants et des statuts, puis relit l'API (invalidation du cache RTK Query).
 */
export type RealtimeNotification = { type: string; data: unknown }

export interface RealtimeSubscriber {
  /** Retourne la fonction de désabonnement. */
  subscribe(eventTypes: readonly string[], onEvent: (notification: RealtimeNotification) => void): () => void
  /** Rouvre l'unique flux après une connexion ou une déconnexion (nouveau ticket, topics privés à jour). */
  restart(): void
}
