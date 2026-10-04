"use client"
import { createContext, useContext } from "react"
import type { GeolocationGateway, InteractiveMapGateway } from "../core/application/ports/gateway/places.gateway"
import { BrowserGeolocationGateway } from "../core/infrastructure/for-production/gateway/browser/geolocation.browser.gateway"
import { LeafletCdnMapGateway } from "../core/infrastructure/for-production/gateway/browser/leaflet-cdn.map.gateway"

/**
 * Composition des capacités du navigateur utilisées par la carte (F45) : géolocalisation
 * et carte interactive. Hors du store car ce ne sont pas des données ; un test fournit
 * ses doubles avec `PlacesDependencies.Provider`.
 */
export const PlacesDependencies = createContext<{ geolocation: GeolocationGateway; map: InteractiveMapGateway }>({
  geolocation: new BrowserGeolocationGateway(),
  map: new LeafletCdnMapGateway()
})

export const usePlacesDependencies = () => useContext(PlacesDependencies)
