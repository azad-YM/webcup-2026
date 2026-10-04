"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { Route } from "next"
import { SelectField, TextField } from "@/modules/shared/ui/components/form-field"
import {
  distinctValues,
  filtersToParams,
  hasActiveFilters,
  readFilters,
  type FilterableRequest,
  type RequestFilterState
} from "../../core/domain/request-filters"
import { CATEGORY_LABELS, STATUS_LABELS, type RequestCategory, type RequestStatus } from "../../core/domain/service-request"

/** F79 : critères lus et écrits dans l'adresse de la page. */
export function useRequestFilters(): [RequestFilterState, (next: Partial<RequestFilterState>) => void, () => void] {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const filters = readFilters(params)
  const go = (state: RequestFilterState) => {
    const query = filtersToParams(state, new URLSearchParams(params.toString())).toString()
    router.replace(`${pathname}${query ? `?${query}` : ""}` as Route, { scroll: false })
  }
  return [filters, (next) => go({ ...filters, ...next }), () => go({ q: "", category: "", status: "", district: "", service: "", sort: filters.sort })]
}

/** Barre de filtres accessible : recherche, sujet (service, catégorie), état, quartier, tri. */
export function RequestFilters({ idPrefix, items, filters, onChange, onReset, withSupports = false, shown }: {
  idPrefix: string
  items: FilterableRequest[]
  filters: RequestFilterState
  onChange: (next: Partial<RequestFilterState>) => void
  onReset: () => void
  withSupports?: boolean
  shown: number
}) {
  const categories = distinctValues(items, (item) => item.category ?? "other") as RequestCategory[]
  const districts = distinctValues(items, (item) => item.district)
  const services = distinctValues(items, (item) => item.serviceId)
  const statuses = distinctValues(items, (item) => item.status) as RequestStatus[]
  return (
    <form role="search" aria-label="Filtrer les demandes" onSubmit={(event) => event.preventDefault()} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField id={`${idPrefix}-q`} label="Rechercher" type="search" value={filters.q} hint="Objet, lieu ou numéro de suivi." onChange={(event) => onChange({ q: event.target.value })} />
        <SelectField id={`${idPrefix}-categorie`} label="Catégorie" placeholder="Toutes" value={filters.category}
          options={categories.map((value) => ({ value, label: CATEGORY_LABELS[value] ?? value }))}
          onChange={(event) => onChange({ category: event.target.value as RequestCategory | "" })} />
        {services.length > 0 && (
          <SelectField id={`${idPrefix}-service`} label="Service" placeholder="Tous" value={filters.service}
            options={services.map((value) => ({ value, label: value }))}
            onChange={(event) => onChange({ service: event.target.value })} />
        )}
        <SelectField id={`${idPrefix}-etat`} label="État" placeholder="Tous" value={filters.status}
          options={statuses.map((value) => ({ value, label: STATUS_LABELS[value] }))}
          onChange={(event) => onChange({ status: event.target.value as RequestStatus | "" })} />
        {districts.length > 0 && (
          <SelectField id={`${idPrefix}-quartier`} label="Quartier" placeholder="Tous" value={filters.district}
            options={districts.map((value) => ({ value, label: value }))}
            onChange={(event) => onChange({ district: event.target.value })} />
        )}
        <SelectField id={`${idPrefix}-tri`} label="Trier par" value={filters.sort}
          options={[
            { value: "recent", label: "Les plus récentes" },
            { value: "ancien", label: "Les plus anciennes" },
            ...(withSupports ? [{ value: "soutiens", label: "Les plus soutenues" }] : [])
          ]}
          onChange={(event) => onChange({ sort: event.target.value as RequestFilterState["sort"] })} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p role="status" className="text-sm text-slate-700">{shown} demande{shown > 1 ? "s" : ""} sur {items.length}</p>
        {hasActiveFilters(filters) && (
          <button type="button" onClick={onReset} className="text-sm font-medium text-teal-800 underline underline-offset-4">Effacer les filtres</button>
        )}
      </div>
    </form>
  )
}
