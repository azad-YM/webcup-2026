import type { GeolocationGateway } from "../../../../application/ports/gateway/places.gateway"
import type { Position } from "../../../../domain/service-places"

export type GeolocationErrorCode = "unsupported" | "denied" | "unavailable"

export class GeolocationError extends Error {
  constructor(readonly code: GeolocationErrorCode) {
    super(code)
  }
}

/** Position du navigateur, demandée uniquement après un clic sur « Près de moi » ; jamais envoyée au serveur. */
export class BrowserGeolocationGateway implements GeolocationGateway {
  currentPosition(): Promise<Position> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new GeolocationError("unsupported"))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => reject(new GeolocationError(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable")),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
      )
    })
  }
}
