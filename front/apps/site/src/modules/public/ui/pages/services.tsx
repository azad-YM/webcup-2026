"use client"
import { useEffect, useState } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import Link from "next/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, MapPin, Phone } from "@boilerplate/shared-ui/components/icon"
import { ContextualTip } from "@boilerplate/shared-ui/components/a11y"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { SelectField, TextField } from "@/modules/shared/ui/components/form-field"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CONTENT_POLLING_MS, useGetServiceRatingQuery, useLazyRefineServiceSearchQuery, useListServicesQuery, useSearchServicesQuery } from "../../core/application/rtk-api/public"
import { rankServices } from "../../core/domain/service-search"
import { PLAIN_MESSAGES } from "../i18n/plain-messages"
import { ExplainSimply } from "../components/explain-simply"
import { PlainLanguageSwitch } from "../components/plain-language"
import {
  filterServices,
  findService,
  isServiceCategory,
  SERVICE_CATEGORIES,
  type MunicipalService,
  type ServiceCategory
} from "../../core/domain/municipal-service"
import { serviceIcon, ServiceCard } from "../components/content-cards"
import { format } from "@/modules/shared/core/i18n/locales"
import { useLocale, useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { COMMON_MESSAGES } from "@/modules/shared/ui/i18n/common-messages"
import { directionsUrl, hasLocation, localizeService, openStreetMapUrl } from "../../core/domain/service-places"
import { categoryLabel, PLACES_MESSAGES } from "../i18n/places-messages"
import { OnDemandMap } from "../components/on-demand-map"
import { PhoneLink } from "../components/place-card"
import { ServiceStatusNotice } from "../components/service-status-notice"


/** Garde la recherche dans l’adresse pour pouvoir la partager ou y revenir. */
function syncUrl(query: string, category: ServiceCategory | null) {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (category) params.set("categorie", category)
  const search = params.toString()
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`)
}

/** Valeur stabilisée après une courte pause de saisie (évite un appel par lettre tapée). */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** D10 : toujours une issue quand la recherche ne suffit pas (assistant, mairie, urgences, accueil). */
function SearchWayOut({ query }: { query: string }) {
  const p = useMessages(PLAIN_MESSAGES)
  const link = "font-medium text-teal-800 underline underline-offset-4"
  return (
    <aside aria-label={p.notFoundTitle} className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">{p.notFoundTitle}</h2>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        <Link href={(query.trim() ? `/aide/assistant?q=${encodeURIComponent(query.trim())}` : "/aide/assistant") as Route} className={link}>{p.describeNeed}</Link>
        <Link href={"/espace/demandes/nouvelle" as Route} className={link}>{p.contactCityHall}</Link>
        <Link href="/urgences" className={link}>{p.emergencies}</Link>
        <Link href="/bienvenue" className={link}>{p.newcomers}</Link>
      </p>
    </aside>
  )
}

function ServiceCatalog({ services }: { services: MunicipalService[] }) {
  const params = useSearchParams()
  const [query, setQuery] = useState(() => params.get("q") ?? "")
  const [category, setCategory] = useState<ServiceCategory | null>(() => {
    const value = params.get("categorie")
    return isServiceCategory(value) ? value : null
  })
  const { locale } = useLocale()
  const p = useMessages(PLAIN_MESSAGES)
  // D10 : classement tolérant par l’API (fautes, accents, synonymes) ; filtre local exact en attendant ou en cas de panne.
  const debounced = useDebounced(query.trim())
  const ranked = useSearchServicesQuery({ query: debounced, locale }, { skip: debounced.length < 2 })
  const [refine, refined] = useLazyRefineServiceSearchQuery()
  const assisted = refined.data && refined.originalArgs?.query === debounced ? refined.data : null
  const apiResult = assisted ?? (ranked.data && ranked.originalArgs?.query === debounced && debounced === query.trim() ? ranked.data : null)
  const ordered = apiResult ? rankServices(services, apiResult.results) : null
  const results = query.trim().length < 2 || !ordered
    ? filterServices(services, { query, category })
    : ordered.filter((service) => !category || service.category === category)
  const modelAvailable = ranked.data?.modelAvailable ?? false
  const runAssisted = () => {
    if (debounced.length >= 2 && modelAvailable) void refine({ query: debounced, locale }, true)
  }
  // Aucun résultat local : la recherche assistée est tentée une fois, si le modèle est disponible.
  const noLocalResult = ranked.data?.query === debounced && ranked.data.results.length === 0
  useEffect(() => {
    if (noLocalResult && modelAvailable && refined.originalArgs?.query !== debounced) void refine({ query: debounced, locale }, true)
  }, [noLocalResult, modelAvailable, debounced, locale, refine, refined.originalArgs?.query])
  const update = (nextQuery: string, nextCategory: ServiceCategory | null) => {
    setQuery(nextQuery)
    setCategory(nextCategory)
    syncUrl(nextQuery, nextCategory)
  }
  const filtered = query.trim() !== "" || category !== null
  const t = useMessages(PLACES_MESSAGES)
  const categoryOptions = Object.keys(SERVICE_CATEGORIES).map((value) => ({ value, label: categoryLabel(t, value) }))
  const suggestion = apiResult?.suggestion && apiResult.suggestion !== query.trim() ? apiResult.suggestion : null
  return (
    <>
      <ContextualTip hintId="astuce-recherche-services" title="Trouver un service" className="mb-4">
        Tapez un mot simple, par exemple « papiers », « bus » ou « médecin ». Vous pouvez aussi choisir un thème.
      </ContextualTip>
      <form role="search" aria-label={t.searchForm} onSubmit={(event) => { event.preventDefault(); runAssisted() }} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <TextField id="recherche-service" label={t.searchLabel} type="search" value={query} hint={t.searchHint} onChange={(event) => update(event.target.value, category)} />
        <SelectField
          id="categorie-service"
          label={t.filterCategory}
          placeholder={t.allCategories}
          options={categoryOptions}
          value={category ?? ""}
          onChange={(event) => update(query, isServiceCategory(event.target.value) ? event.target.value : null)}
        />
        <button type="button" disabled={!filtered} onClick={() => update("", null)} className="h-12 rounded-xl border border-slate-300 px-4 font-medium hover:bg-slate-50 disabled:opacity-50">
          {t.clear}
        </button>
      </form>
      {suggestion && (
        <p className="mt-4 text-slate-800">
          {p.didYouMean} <button type="button" onClick={() => update(suggestion, category)} className="font-semibold text-teal-800 underline underline-offset-4">{suggestion}</button>
        </p>
      )}
      {assisted?.reformulation && <p className="mt-3 text-slate-800">{format(p.understood, { text: assisted.reformulation })} <span className="text-sm text-slate-600">{p.sourceModel}</span></p>}
      {refined.isFetching && <p role="status" className="mt-3 text-sm text-slate-700">{p.refining}</p>}
      {modelAvailable && debounced.length >= 2 && !assisted && !refined.isFetching && (
        <p className="mt-3"><button type="button" onClick={runAssisted} className="rounded-lg border border-teal-700 px-3 py-1.5 text-sm font-medium text-teal-900 hover:bg-teal-50">{p.refine}</button></p>
      )}
      <p className="mt-6 font-medium text-slate-800" role="status" aria-live="polite">
        {results.length === 0 ? t.noService : results.length === 1 ? t.oneService : format(t.manyServices, { count: results.length })}
      </p>
      {results.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t.noServiceTitle}>
            <p>{t.tryOther} <button type="button" onClick={() => update("", null)} className="font-medium text-teal-800 underline">{t.showAll}</button>.</p>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((service) => <li key={service.id}><ServiceCard service={service} headingLevel={2} /></li>)}
        </ul>
      )}
      {filtered && <SearchWayOut query={query} />}
    </>
  )
}

/** F36 : horaires et informations des transports municipaux. */
function TransportTimetable({ transport }: { transport: NonNullable<MunicipalService["transport"]> }) {
  return (
    <section aria-labelledby="titre-horaires" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 id="titre-horaires" className="text-xl font-semibold">Horaires et informations des transports</h2>
      <dl className="mt-4 space-y-4 text-slate-800">
        <div><dt className="font-semibold">Lignes et trajets</dt><dd className="mt-1 whitespace-pre-line">{transport.route}</dd></div>
        <div><dt className="font-semibold">Horaires</dt><dd className="mt-1 whitespace-pre-line">{transport.timetable}</dd></div>
        {transport.information && <div><dt className="font-semibold">Informations pratiques</dt><dd className="mt-1 whitespace-pre-line">{transport.information}</dd></div>}
      </dl>
    </section>
  )
}

/** F45 : mini-localisation sur la fiche (adresse, itinéraire, carte à la demande). */
function ServiceLocation({ service }: { service: MunicipalService }) {
  const t = useMessages(PLACES_MESSAGES)
  if (!hasLocation(service)) return null
  return (
    <section aria-labelledby="titre-localisation" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 id="titre-localisation" className="text-xl font-semibold">{t.location}</h2>
      <p className="mt-3 text-slate-800" lang="fr">{service.location.address}{service.location.district ? ` — ${format(t.districtLabel, { district: service.location.district })}` : ""}</p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <a href={directionsUrl(service.location)} target="_blank" rel="noopener noreferrer" aria-label={format(t.directionsLabel, { name: service.name })} className="font-semibold text-teal-800 underline underline-offset-4">{t.directions}</a>
        <a href={openStreetMapUrl(service.location)} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline underline-offset-4">{t.openStreetMap}</a>
        <Link href={`/carte?service=${encodeURIComponent(service.id)}` as Route} className="font-medium text-teal-800 underline underline-offset-4">{t.showOnMap}</Link>
      </p>
      <div className="mt-4"><OnDemandMap services={[service]} focusId={service.id} compact /></div>
    </section>
  )
}

function UntranslatedNote({ show }: { show: boolean }) {
  const common = useMessages(COMMON_MESSAGES)
  if (!show) return null
  return <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-0.5 text-sm text-slate-700" title={common.notTranslatedHint}>{common.notTranslated} — <span className="ms-1">{common.notTranslatedHint}</span></p>
}

/** F76 : note moyenne des habitants (sans identité) et lien pour donner son avis. */
function ServiceRating({ serviceId }: { serviceId: string }) {
  const rating = useGetServiceRatingQuery(serviceId)
  const summary = rating.data && rating.data.count > 0
    ? `${rating.data.average.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5 · ${rating.data.count} avis`
    : null
  return (
    <section aria-labelledby="titre-avis-service" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5" lang="fr">
      <h2 id="titre-avis-service" className="text-lg font-semibold">Avis des habitants</h2>
      <p className="mt-1 text-slate-800">{summary ? <>Note moyenne : <strong>{summary}</strong></> : rating.isLoading ? "Chargement des avis…" : "Pas encore d’avis sur ce service."}</p>
      <Link href={`/espace/avis?service=${encodeURIComponent(serviceId)}` as Route} className="mt-3 inline-flex font-medium text-teal-800 underline underline-offset-4">
        Vous avez utilisé ce service ? Donnez votre avis
      </Link>
    </section>
  )
}

function ServiceDetail({ service }: { service: MunicipalService }) {
  const Icon = serviceIcon(service.id)
  const t = useMessages(PLACES_MESSAGES)
  const { locale } = useLocale()
  const text = localizeService(service, locale)
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        {/* F64 : l’état du service vient en tête de fiche, avant toute démarche. */}
        <div className="mb-6 [&>*]:mt-0"><ServiceStatusNotice service={service} context="fiche" /></div>
        {/* F89 : version en clair validée, affichée en premier si l’habitant la demande. */}
        <PlainLanguageSwitch text={service.plainLanguage} />
        <Icon className="size-10 text-teal-700" aria-hidden="true" />
        <p className="mt-4 text-lg leading-8 text-slate-800" lang={text.descriptionUntranslated ? "fr" : undefined}>{text.description}</p>
        <UntranslatedNote show={text.descriptionUntranslated} />
        <ExplainSimply text={text.description} plainVersion={service.plainLanguage} />
        {!service.disabled && (
          <p className="mt-6 flex flex-wrap gap-3">
            <Link href={`/espace/demandes/nouvelle?service=${encodeURIComponent(service.id)}` as Route} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">
              Faire une demande à ce service
            </Link>
            <Link href={"/espace/rendez-vous" as Route} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">
              Prendre rendez-vous
            </Link>
          </p>
        )}
        <ServiceLocation service={service} />
        <ServiceRating serviceId={service.id} />
        {service.transport && <TransportTimetable transport={service.transport} />}
        <h2 className="mt-8 text-xl font-semibold">{t.whatYouCanDo}</h2>
        <ul className="mt-4 list-disc space-y-2 ps-6 text-slate-800" lang="fr">
          {service.actions.map((action) => <li key={action}>{action}</li>)}
        </ul>
        <ExplainSimply text={service.actions.join(". ")} />
      </div>
      <aside aria-labelledby="titre-contact" className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
        <h2 id="titre-contact" className="text-lg font-semibold">{t.contact}</h2>
        <dl className="mt-4 space-y-4 text-slate-800">
          <div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.address}</dt><dd lang="fr">{service.contact.place}</dd></div></div>
          <div className="flex gap-3"><Clock className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.hours}</dt><dd lang="fr">{service.contact.hours}</dd></div></div>
          {service.contact.phone && (
            <div className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.phone}</dt><dd><PhoneLink phone={service.contact.phone} label="" /></dd></div></div>
          )}
        </dl>
      </aside>
      <p className="lg:col-span-2">
        <Link href="/services" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" /> {t.allServices}
        </Link>
      </p>
    </div>
  )
}

export function ServicesPage() {
  const serviceId = useSearchParams().get("service")
  const { data, error, isFetching, refetch } = useListServicesQuery(undefined, polling(CONTENT_POLLING_MS))
  const service = data && serviceId ? findService(data, serviceId) : null
  const t = useMessages(PLACES_MESSAGES)
  const common = useMessages(COMMON_MESSAGES)
  const { locale } = useLocale()
  const text = service ? localizeService(service, locale) : null
  const header = service && text
    ? <PageHeader trail={[{ label: common.services, href: "/services" }, { label: text.name }]} title={text.name} lead={<>{text.summary}{text.untranslated && <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-sm text-slate-700" title={common.notTranslatedHint}>{common.notTranslated}</span>}</>} />
    : <PageHeader trail={[{ label: common.services }]} title={t.catalogTitle} lead={t.catalogLead} />
  return (
    <>
      {header}
      <PageBody>
        {error ? (
          <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les services."} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label="Chargement des services"><SkeletonCards count={6} /></LoadingState>
        ) : serviceId && !service ? (
          <EmptyState title="Ce service est introuvable.">
            <Link href="/services" className="font-medium text-teal-800 underline">Voir tous les services</Link>
          </EmptyState>
        ) : service ? (
          <ServiceDetail service={service} />
        ) : data.length === 0 ? (
          <EmptyState title="Aucun service n’est encore publié." />
        ) : (
          <ServiceCatalog services={data} />
        )}
      </PageBody>
    </>
  )
}
