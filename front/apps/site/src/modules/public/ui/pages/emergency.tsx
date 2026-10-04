"use client"
import { Phone, Siren } from "@boilerplate/shared-ui/components/icon"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { format } from "@/modules/shared/core/i18n/locales"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CONTENT_POLLING_MS, useListServicesQuery } from "../../core/application/rtk-api/public"
import { emergencyServices, sortByDistance } from "../../core/domain/service-places"
import { PLACES_MESSAGES } from "../i18n/places-messages"
import { PlaceCard } from "../components/place-card"
import { NearMeButton } from "../components/near-me-button"
import { useNearMe } from "../hooks/use-near-me"

const NUMBERS = [
  { number: "15", key: "n15", sms: false },
  { number: "17", key: "n17", sms: false },
  { number: "18", key: "n18", sms: false },
  { number: "112", key: "n112", sms: false },
  { number: "114", key: "n114", sms: true }
] as const

/**
 * F46 : page « Urgences », la plus directe possible. Les numéros sont statiques
 * (affichés même si l’API est injoignable) ; les lieux viennent du catalogue d’Administration.
 */
export function EmergencyPage() {
  const t = useMessages(PLACES_MESSAGES)
  const nearMe = useNearMe()
  const { data, error, isFetching, refetch } = useListServicesQuery(undefined, polling(CONTENT_POLLING_MS))
  const places = data ? sortByDistance(emergencyServices(data), nearMe.position) : []
  return (
    <>
      <PageHeader trail={[{ label: t.emergencyTitle }]} title={t.emergencyTitle} lead={t.emergencyLead}>
        <p className="mt-4 flex items-start gap-3 rounded-xl border-s-4 border-red-600 bg-red-50 p-4 text-lg font-semibold text-red-950">
          <Siren className="mt-1 size-6 shrink-0" aria-hidden="true" /> {t.lifeDanger}
        </p>
      </PageHeader>
      <PageBody>
        <section aria-labelledby="titre-numeros">
          <h2 id="titre-numeros" className="text-2xl font-semibold tracking-tight">{t.callTitle}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {NUMBERS.map((item) => (
              <li key={item.number}>
                <a
                  href={item.sms ? `sms:${item.number}` : `tel:${item.number}`}
                  aria-label={`${format(t.callNumber, { number: item.number })} — ${t[item.key]}`}
                  className="flex h-full flex-col items-start gap-2 rounded-2xl bg-red-700 p-5 text-white shadow-sm hover:bg-red-800 focus-visible:outline-offset-4"
                >
                  <span className="inline-flex items-center gap-2 text-5xl font-bold tabular-nums" dir="ltr">
                    <Phone className="size-8" aria-hidden="true" /> {item.number}
                  </span>
                  <span className="text-base font-medium leading-6">{t[item.key]}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="titre-lieux-urgence" className="mt-12">
          <h2 id="titre-lieux-urgence" className="text-2xl font-semibold tracking-tight">{t.nearestTitle}</h2>
          <p className="mt-2 text-slate-700">{t.nearestLead}</p>
          <div className="mt-4"><NearMeButton state={nearMe} onLocate={() => void nearMe.locate()} /></div>
          <div className="mt-6">
            {error ? (
              <ErrorState message={toQueryError(error)?.data ?? t.loadError} onRetry={() => void refetch()} retrying={isFetching} />
            ) : !data ? (
              <LoadingState label={t.loadingPlaces}><SkeletonCards count={3} /></LoadingState>
            ) : places.length === 0 ? (
              <EmptyState title={t.emptyEmergency} />
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {places.map((service) => <li key={service.id}><PlaceCard service={service} position={nearMe.position} /></li>)}
              </ul>
            )}
          </div>
        </section>
      </PageBody>
    </>
  )
}
