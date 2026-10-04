"use client"
import { useState } from "react"
import type { Position } from "../../core/domain/service-places"
import { GeolocationError } from "../../core/infrastructure/for-production/gateway/browser/geolocation.browser.gateway"
import { usePlacesDependencies } from "../places-dependencies"

export type NearMeState = { status: "idle" | "locating" | "located" | "denied" | "unavailable" | "unsupported"; position: Position | null }

/** « Près de moi » (F45) : position demandée seulement sur action de l’habitant. */
export function useNearMe() {
  const { geolocation } = usePlacesDependencies()
  const [state, setState] = useState<NearMeState>({ status: "idle", position: null })
  const locate = async () => {
    setState((current) => ({ ...current, status: "locating" }))
    try {
      setState({ status: "located", position: await geolocation.currentPosition() })
    } catch (error) {
      setState({ status: error instanceof GeolocationError ? error.code : "unavailable", position: null })
    }
  }
  return { ...state, locate }
}
