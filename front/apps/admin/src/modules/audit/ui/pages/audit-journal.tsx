import { useState, type FormEvent } from "react"
import { Button, Input, Label } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useAuditEntriesQuery } from "../../core/application/rtk-api/audit"
import {
  actionLabel,
  CATEGORY_LABELS,
  detailRows,
  EMPTY_AUDIT_FILTERS,
  type AuditFilters,
} from "../../core/domain/audit-entry"

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "medium" })

export function AuditJournalPage() {
  const [draft, setDraft] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS)
  const [applied, setApplied] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS)
  const query = useAuditEntriesQuery(applied, { refetchOnMountOrArgChange: true })
  const facets = query.data?.facets
  const set = (patch: Partial<AuditFilters>) => setDraft(current => ({ ...current, ...patch }))
  const filtered = Object.values(applied).some(value => value !== "")

  function submit(event: FormEvent) {
    event.preventDefault()
    setApplied({ ...draft, q: draft.q.trim() })
  }

  function reset() {
    setDraft(EMPTY_AUDIT_FILTERS)
    setApplied(EMPTY_AUDIT_FILTERS)
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6" aria-labelledby="audit-title">
      <div>
        <h1 id="audit-title" className="text-2xl font-semibold">Journal des actions</h1>
        <p className="mt-2 text-muted-foreground">
          Qui a fait quoi, quand et sur quoi dans l’administration : rôles, membres, services, publications, alertes, demandes citoyennes, comptes et connexions bloquées. Les lignes ne peuvent être ni modifiées ni supprimées.
        </p>
      </div>

      <form role="search" aria-label="Filtrer le journal" onSubmit={submit} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1 lg:col-span-2">
          <Label htmlFor="audit-q">Rechercher</Label>
          <Input id="audit-q" type="search" value={draft.q} maxLength={100} placeholder="Nom, référence, titre…" onChange={event => set({ q: event.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-actor">Acteur</Label>
          <select id="audit-actor" className={selectClass} value={draft.actor} onChange={event => set({ actor: event.target.value })}>
            <option value="">Tous</option>
            {facets?.actors.filter(actor => actor.id !== null).map(actor => <option key={actor.id} value={actor.id ?? ""}>{actor.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-action">Type d’action</Label>
          <select id="audit-action" className={selectClass} value={draft.action} onChange={event => set({ action: event.target.value })}>
            <option value="">Toutes</option>
            {facets?.actions.map(action => <option key={action} value={action}>{actionLabel(action)}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-from">Du</Label>
          <Input id="audit-from" type="date" value={draft.from} onChange={event => set({ from: event.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-to">Au</Label>
          <Input id="audit-to" type="date" value={draft.to} min={draft.from || undefined} onChange={event => set({ to: event.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit" disabled={query.isFetching}>Filtrer</Button>
          <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Actualiser</Button>
          {filtered && <Button type="button" variant="ghost" onClick={reset}>Effacer les filtres</Button>}
        </div>
      </form>

      {query.isLoading && <p role="status">Chargement du journal…</p>}
      {query.isError && (
        <div role="alert" className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{getErrorMessage(query.error)}</p>
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      )}

      {query.data && !query.isError && (
        query.data.items.length === 0 ? (
          <p role="status" className="rounded-2xl bg-white p-6 text-sm text-muted-foreground shadow-sm">
            {filtered ? "Aucune action ne correspond à ces filtres." : "Aucune action n’a encore été enregistrée."}
          </p>
        ) : (
          <>
            <p role="status" className="text-sm text-muted-foreground">
              {query.data.items.length} action(s) affichée(s), de la plus récente à la plus ancienne
              {query.data.items.length >= query.data.limit ? ` (limitées aux ${query.data.limit} plus récentes : affinez les filtres)` : ""}.
            </p>
            <ol className="space-y-3">
              {query.data.items.map(entry => {
                const details = detailRows(entry.details)
                return (
                  <li key={entry.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">
                        <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700">{CATEGORY_LABELS[entry.category] ?? entry.category}</span>
                        {actionLabel(entry.action)}
                      </p>
                      <time dateTime={entry.occurredAt} className="text-sm text-muted-foreground">{dateFormat.format(new Date(entry.occurredAt))}</time>
                    </div>
                    <p className="mt-2">{entry.summary}</p>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                      <dt className="text-muted-foreground">Par</dt>
                      <dd>{entry.actor.label}</dd>
                      <dt className="text-muted-foreground">Sur</dt>
                      <dd className="break-all">{entry.target.type}{entry.target.id ? ` · ${entry.target.id}` : ""}</dd>
                    </dl>
                    {details.length > 0 && (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-primary">Détail</summary>
                        <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
                          {details.map(row => (
                            <div key={row.label} className="contents">
                              <dt className="text-muted-foreground">{row.label}</dt>
                              <dd className="break-all">{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                  </li>
                )
              })}
            </ol>
          </>
        )
      )}
    </section>
  )
}
