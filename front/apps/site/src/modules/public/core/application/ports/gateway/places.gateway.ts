import type { Position } from "../../../domain/service-places"

/** F45 : position de l’habitant, seulement s’il l’accepte (« près de moi »). */
export interface GeolocationGateway {
  /** Rejette avec un message en clair si la position est refusée ou indisponible. */
  currentPosition(): Promise<Position>
}

export type MapMarker = { id: string; lat: number; lng: number; title: string; subtitle: string; href: string; emphasis: boolean }

/** Carte interactive chargée à la demande (sobriété) ; la liste textuelle reste l’équivalent accessible. */
export interface InteractiveMapGateway {
  /** Affiche la carte dans `container` et rend une fonction de nettoyage. */
  render(container: HTMLElement, markers: MapMarker[], options: { linkLabel: string; focusId?: string | null }): Promise<() => void>
}
