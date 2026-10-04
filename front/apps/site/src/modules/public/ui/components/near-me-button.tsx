"use client"
import { LocateFixed } from "@boilerplate/shared-ui/components/icon"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import type { NearMeState } from "../hooks/use-near-me"
import { PLACES_MESSAGES } from "../i18n/places-messages"

/** Bouton « Près de moi » et son résultat annoncé (refus, position introuvable, tri effectué). */
export function NearMeButton({ state, onLocate }: { state: NearMeState; onLocate: () => void }) {
  const t = useMessages(PLACES_MESSAGES)
  const message =
    state.status === "locating" ? t.locating
      : state.status === "located" ? t.located
        : state.status === "denied" ? t.geoDenied
          : state.status === "unavailable" ? t.geoUnavailable
            : state.status === "unsupported" ? t.geoUnsupported
              : ""
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onLocate}
        disabled={state.status === "locating"}
        aria-describedby="aide-pres-de-moi"
        className="inline-flex h-12 w-fit items-center gap-2 rounded-xl border border-teal-700 px-4 font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-60"
      >
        <LocateFixed className="size-5" aria-hidden="true" /> {t.nearMe}
      </button>
      <p id="aide-pres-de-moi" className="text-sm text-slate-600">{t.nearMeHint}</p>
      <p role="status" aria-live="polite" className="text-sm font-medium text-slate-800">{message}</p>
    </div>
  )
}
