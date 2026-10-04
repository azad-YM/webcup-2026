"use client"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { format } from "@/modules/shared/core/i18n/locales"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { SelectField } from "@/modules/shared/ui/components/form-field"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CONTENT_POLLING_MS, useListServicesQuery } from "../../core/application/rtk-api/public"
import { isServiceCategory, SERVICE_CATEGORIES, type MunicipalService, type ServiceCategory } from "../../core/domain/municipal-service"
import { hasLocation, sortByDistance, type PlacedService } from "../../core/domain/service-places"
import { categoryLabel, PLACES_MESSAGES } from "../i18n/places-messages"
import { PlaceCard } from "../components/place-card"
import { OnDemandMap } from "../components/on-demand-map"
import { NearMeButton } from "../components/near-me-button"
import { useNearMe } from "../hooks/use-near-me"

function PlacesExplorer({ services }: { services: MunicipalService[] }) {
  const t = useMessages(PLACES_MESSAGES)
  const params = useSearchParams()
  const focusId = params.get("service")
  const nearMe = useNearMe()
  const [category, setCategory] = useState<ServiceCategory | null>(() => {
    const value = params.get("categorie")
    return isServiceCategory(value) ? value : null
  })
  const [district, setDistrict] = useState<string | null>(null)
  const [emergencyOnly, setEmergencyOnly] = useState(params.get("urgences") === "1")
  const placed = useMemo(() => services.filter(hasLocation), [services])
  const districts = useMemo(() => [...new Set(placed.map((service) => service.location.district).filter((value): value is string => Boolean(value)))].sort(), [placed])
  const results = useMemo(() => sortByDistance(placed.filter((service) =>
    (!category || service.category === category)
    && (!district || service.location.district === district)
    && (!emergencyOnly || Boolean(service.emergency))
  ), nearMe.position) as PlacedService[], [placed, category, district, emergencyOnly, nearMe.position])
  const filtered = category !== null || district !== null || emergencyOnly
  return (
    <div className="space-y-8">
      <OnDemandMap services={results} focusId={focusId} startOpen={Boolean(focusId)} />
      <section aria-labelledby="titre-liste-lieux">
        <h2 id="titre-liste-lieux" className="text-2xl font-semibold tracking-tight">{t.listTitle}</h2>
        <form role="search" aria-label={t.filters} onSubmit={(event) => event.preventDefault()} className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <SelectField
            id="lieux-theme"
            label={t.filterCategory}
            placeholder={t.allCategories}
            options={Object.keys(SERVICE_CATEGORIES).map((value) => ({ value, label: categoryLabel(t, value) }))}
            value={category ?? ""}
            onChange={(event) => setCategory(isServiceCategory(event.target.value) ? event.target.value : null)}
          />
          <SelectField
            id="lieux-quartier"
            label={t.filterDistrict}
            placeholder={t.allDistricts}
            options={districts.map((value) => ({ value, label: value }))}
            value={district ?? ""}
            onChange={(event) => setDistrict(event.target.value || null)}
          />
          <label className="flex h-12 items-center gap-3 font-medium">
            <input type="checkbox" className="size-5 accent-red-700" checked={emergencyOnly} onChange={(event) => setEmergencyOnly(event.target.checked)} />
            {t.emergencyOnly}
          </label>
          <div className="md:col-span-3 flex flex-wrap items-start justify-between gap-4">
            <NearMeButton state={nearMe} onLocate={() => void nearMe.locate()} />
            <button type="button" disabled={!filtered} onClick={() => { setCategory(null); setDistrict(null); setEmergencyOnly(false) }} className="h-12 rounded-xl border border-slate-300 px-4 font-medium hover:bg-slate-50 disabled:opacity-50">
              {t.clear}
            </button>
          </div>
        </form>
        <p className="mt-6 font-medium text-slate-800" role="status" aria-live="polite">
          {results.length === 0 ? t.countNone : results.length === 1 ? t.countOne : format(t.countMany, { count: results.length })}
        </p>
        {results.length > 0 && (
          <ul className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.map((service) => <li key={service.id} id={`lieu-${service.id}`}><PlaceCard service={service} position={nearMe.position} /></li>)}
          </ul>
        )}
      </section>
    </div>
  )
}

/** F45 : carte des services physiques, chargée à la demande, et liste textuelle équivalente. */
export function ServicesMapPage() {
  const t = useMessages(PLACES_MESSAGES)
  const { data, error, isFetching, refetch } = useListServicesQuery(undefined, { pollingInterval: CONTENT_POLLING_MS })
  return (
    <>
      <PageHeader trail={[{ label: t.mapTitle }]} title={t.mapTitle} lead={t.mapLead} />
      <PageBody>
        {error ? (
          <ErrorState message={toQueryError(error)?.data ?? t.loadError} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label={t.loadingPlaces}><SkeletonCards count={6} /></LoadingState>
        ) : data.filter(hasLocation).length === 0 ? (
          <EmptyState title={t.countNone} />
        ) : (
          <PlacesExplorer services={data} />
        )}
      </PageBody>
    </>
  )
}
