"use client"
import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, MapPin, Phone } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { SelectField, TextField } from "@/modules/shared/ui/components/form-field"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { useListServicesQuery } from "../../core/application/rtk-api/public"
import {
  filterServices,
  findService,
  isServiceCategory,
  SERVICE_CATEGORIES,
  type MunicipalService,
  type ServiceCategory
} from "../../core/domain/municipal-service"
import { serviceIcon, ServiceCard } from "../components/content-cards"

const CATEGORY_OPTIONS = Object.entries(SERVICE_CATEGORIES).map(([value, label]) => ({ value, label }))

/** Garde la recherche dans l’adresse pour pouvoir la partager ou y revenir. */
function syncUrl(query: string, category: ServiceCategory | null) {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (category) params.set("categorie", category)
  const search = params.toString()
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`)
}

function ServiceCatalog({ services }: { services: MunicipalService[] }) {
  const params = useSearchParams()
  const [query, setQuery] = useState(() => params.get("q") ?? "")
  const [category, setCategory] = useState<ServiceCategory | null>(() => {
    const value = params.get("categorie")
    return isServiceCategory(value) ? value : null
  })
  const results = filterServices(services, { query, category })
  const update = (nextQuery: string, nextCategory: ServiceCategory | null) => {
    setQuery(nextQuery)
    setCategory(nextCategory)
    syncUrl(nextQuery, nextCategory)
  }
  const filtered = query.trim() !== "" || category !== null
  return (
    <>
      <form role="search" aria-label="Filtrer les services" onSubmit={(event) => event.preventDefault()} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <TextField id="recherche-service" label="Rechercher un service" type="search" value={query} hint="Exemple : naissance, médecin, navette, déchets…" onChange={(event) => update(event.target.value, category)} />
        <SelectField
          id="categorie-service"
          label="Thème"
          placeholder="Tous les thèmes"
          options={CATEGORY_OPTIONS}
          value={category ?? ""}
          onChange={(event) => update(query, isServiceCategory(event.target.value) ? event.target.value : null)}
        />
        <button type="button" disabled={!filtered} onClick={() => update("", null)} className="h-12 rounded-xl border border-slate-300 px-4 font-medium hover:bg-slate-50 disabled:opacity-50">
          Effacer
        </button>
      </form>
      <p className="mt-6 font-medium text-slate-800" role="status" aria-live="polite">
        {results.length === 0 ? "Aucun service trouvé." : results.length === 1 ? "1 service trouvé." : `${results.length} services trouvés.`}
      </p>
      {results.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Aucun service ne correspond à votre recherche.">
            <p>Essayez un autre mot ou <button type="button" onClick={() => update("", null)} className="font-medium text-teal-800 underline">affichez tous les services</button>.</p>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((service) => <li key={service.id}><ServiceCard service={service} headingLevel={2} /></li>)}
        </ul>
      )}
    </>
  )
}

function ServiceDetail({ service }: { service: MunicipalService }) {
  const Icon = serviceIcon(service.id)
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <Icon className="size-10 text-teal-700" aria-hidden="true" />
        <p className="mt-4 text-lg leading-8 text-slate-800">{service.description}</p>
        <h2 className="mt-8 text-xl font-semibold">Ce que vous pouvez faire</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-800">
          {service.actions.map((action) => <li key={action}>{action}</li>)}
        </ul>
      </div>
      <aside aria-labelledby="titre-contact" className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
        <h2 id="titre-contact" className="text-lg font-semibold">Contact</h2>
        <dl className="mt-4 space-y-4 text-slate-800">
          <div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">Adresse</dt><dd>{service.contact.place}</dd></div></div>
          <div className="flex gap-3"><Clock className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">Horaires</dt><dd>{service.contact.hours}</dd></div></div>
          {service.contact.phone && (
            <div className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">Téléphone</dt><dd>{service.contact.phone}</dd></div></div>
          )}
        </dl>
      </aside>
      <p className="lg:col-span-2">
        <Link href="/services" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
          <ArrowLeft className="size-4" aria-hidden="true" /> Tous les services
        </Link>
      </p>
    </div>
  )
}

export function ServicesPage() {
  const serviceId = useSearchParams().get("service")
  const { data, error, isFetching, refetch } = useListServicesQuery()
  const service = data && serviceId ? findService(data, serviceId) : null
  const header = service
    ? <PageHeader trail={[{ label: "Services", href: "/services" }, { label: service.name }]} title={service.name} lead={service.summary} />
    : <PageHeader trail={[{ label: "Services" }]} title="Services municipaux" lead="Toutes les démarches proposées par la ville de Nova Terra, classées par thème." />
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
