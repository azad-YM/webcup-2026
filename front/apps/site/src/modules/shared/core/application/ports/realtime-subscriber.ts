/**
 * Abonnement au flux temps réel du site (ADR 004) : un seul flux par onglet, partagé par les écrans.
 * Les topics sont décidés par le serveur selon le compte connecté ; l'écran ne reçoit que des identifiants
 * et des statuts, puis relit l'API (invalidation du cache RTK Query).
 */
export type RealtimeNotification = { type: string; data: unknown }

export interface RealtimeSubscriber {
  /** Retourne la fonction de désabonnement. */
  subscribe(eventTypes: readonly string[], onEvent: (notification: RealtimeNotification) => void): () => void
}
