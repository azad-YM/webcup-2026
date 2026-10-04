import type { InteractiveMapGateway, MapMarker } from "../../../../application/ports/gateway/places.gateway"

/**
 * Carte Leaflet + tuiles OpenStreetMap (F45), chargée seulement quand l’habitant
 * demande la carte : rien n’est téléchargé tant que la liste suffit (sobriété).
 * Leaflet vient de cdnjs avec contrôle d’intégrité (SRI), sans dépendance npm.
 */
const LEAFLET = {
  script: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
  scriptIntegrity: "sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH",
  style: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
  styleIntegrity: "sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H"
}

type LeafletMap = {
  setView(center: [number, number], zoom: number): LeafletMap
  fitBounds(bounds: [number, number][], options?: { padding?: [number, number]; maxZoom?: number }): LeafletMap
  remove(): void
}
type LeafletLayer = { addTo(map: LeafletMap): LeafletLayer; bindPopup(content: HTMLElement): LeafletLayer; openPopup(): LeafletLayer }
type Leaflet = {
  map(element: HTMLElement, options?: Record<string, unknown>): LeafletMap
  tileLayer(url: string, options: Record<string, unknown>): LeafletLayer
  circleMarker(latLng: [number, number], options: Record<string, unknown>): LeafletLayer
}

let loading: Promise<Leaflet> | null = null

function loadLeaflet(): Promise<Leaflet> {
  const existing = (window as unknown as { L?: Leaflet }).L
  if (existing) return Promise.resolve(existing)
  loading ??= new Promise<Leaflet>((resolve, reject) => {
    const style = document.createElement("link")
    style.rel = "stylesheet"
    style.href = LEAFLET.style
    style.integrity = LEAFLET.styleIntegrity
    style.crossOrigin = "anonymous"
    document.head.appendChild(style)
    const script = document.createElement("script")
    script.src = LEAFLET.script
    script.integrity = LEAFLET.scriptIntegrity
    script.crossOrigin = "anonymous"
    script.async = true
    script.onload = () => {
      const leaflet = (window as unknown as { L?: Leaflet }).L
      if (leaflet) resolve(leaflet)
      else reject(new Error("leaflet"))
    }
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error("leaflet"))
    }
    document.head.appendChild(script)
  })
  return loading
}

export class LeafletCdnMapGateway implements InteractiveMapGateway {
  async render(container: HTMLElement, markers: MapMarker[], options: { linkLabel: string; focusId?: string | null }) {
    const L = await loadLeaflet()
    const map = L.map(container, { scrollWheelZoom: false })
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
    }).addTo(map)
    for (const marker of markers) {
      // Contenu du popup construit sans HTML injecté : les textes viennent de l’API.
      const popup = document.createElement("div")
      const title = document.createElement("strong")
      title.textContent = marker.title
      const subtitle = document.createElement("p")
      subtitle.textContent = marker.subtitle
      const link = document.createElement("a")
      link.href = marker.href
      link.textContent = options.linkLabel
      popup.append(title, subtitle, link)
      const layer = L.circleMarker([marker.lat, marker.lng], {
        radius: marker.emphasis ? 11 : 8,
        color: marker.emphasis ? "#b91c1c" : "#0f766e",
        fillColor: marker.emphasis ? "#dc2626" : "#14b8a6",
        fillOpacity: 0.85,
        weight: 2
      }).addTo(map).bindPopup(popup)
      if (marker.id === options.focusId) layer.openPopup()
    }
    const focus = markers.find((marker) => marker.id === options.focusId)
    if (focus) map.setView([focus.lat, focus.lng], 17)
    else if (markers.length > 0) map.fitBounds(markers.map((marker) => [marker.lat, marker.lng]), { padding: [24, 24], maxZoom: 16 })
    return () => map.remove()
  }
}
