"use client"
import { useEffect, useRef, useState } from "react"
import { Map as MapIcon } from "@boilerplate/shared-ui/components/icon"
import { useLocale, useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import type { MunicipalService } from "../../core/domain/municipal-service"
import { localizeService, type PlacedService } from "../../core/domain/service-places"
import { usePlacesDependencies } from "../places-dependencies"
import { PLACES_MESSAGES } from "../i18n/places-messages"
import { serviceHref } from "./content-cards"

/**
 * Carte interactive chargée seulement à la demande (F45, sobriété). Les mêmes informations
 * sont toujours disponibles dans la liste textuelle, qui reste l’équivalent accessible.
 */
export function OnDemandMap({ services, focusId = null, compact = false, startOpen = false }: {
  services: PlacedService[]
  focusId?: string | null
  compact?: boolean
  startOpen?: boolean
}) {
  const t = useMessages(PLACES_MESSAGES)
  const { locale } = useLocale()
  const { map } = usePlacesDependencies()
  const [open, setOpen] = useState(startOpen)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const container = useRef<HTMLDivElement>(null)
  // Clé stable : la carte n’est redessinée que si les lieux affichés changent vraiment.
  const markersKey = JSON.stringify(services.map((service: MunicipalService & PlacedService) => {
    const text = localizeService(service, locale)
    return { id: service.id, lat: service.location.lat, lng: service.location.lng, title: text.name, subtitle: service.location.address, href: serviceHref(service.id), emphasis: Boolean(service.emergency) }
  }))
  useEffect(() => {
    if (!open || !container.current) return
    let cleanup: (() => void) | null = null
    let cancelled = false
    map.render(container.current, JSON.parse(markersKey), { linkLabel: t.seeService, focusId })
      .then((dispose) => {
        if (cancelled) dispose()
        else { cleanup = dispose; setState("ready") }
      })
      .catch(() => { if (!cancelled) setState("error") })
    return () => { cancelled = true; cleanup?.() }
  }, [open, markersKey, focusId, map, t.seeService])
  if (!open) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
        <button type="button" onClick={() => { setState("loading"); setOpen(true) }} aria-describedby="aide-carte" className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-700 px-5 font-semibold text-white hover:bg-teal-800">
          <MapIcon className="size-5" aria-hidden="true" /> {t.showMap}
        </button>
        <p id="aide-carte" className="mt-2 text-sm text-slate-600">{t.showMapHint}</p>
      </div>
    )
  }
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm text-slate-700">{state === "loading" ? t.mapLoading : state === "error" ? t.mapError : ""}</p>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">{t.hideMap}</button>
      </div>
      {/* La carte reste en sens gauche-droite : les coordonnées ne dépendent pas de la langue. */}
      <div
        ref={container}
        role="region"
        aria-label={t.mapRegion}
        dir="ltr"
        className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${compact ? "h-64" : "h-[28rem]"}`}
      />
    </div>
  )
}
