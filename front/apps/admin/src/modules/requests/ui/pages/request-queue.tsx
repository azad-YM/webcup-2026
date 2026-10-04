import { useEffect, useRef, useState } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { ArrowRight, Check, Inbox, MessageSquare, Megaphone, RefreshCw } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { Button, Label } from "@boilerplate/shared-ui/components"
import { REQUEST_QUEUE_POLLING_MS, useListRequestQueueQuery } from "../../core/application/rtk-api/requests"
import { PRIORITIES, PRIORITY_LABELS, REQUEST_STATUSES, STATUS_LABELS, TYPE_LABELS, type RequestPriority, type RequestStatus } from "../../core/domain/service-request"
import { EmergencyBanner } from "../sections/emergency-banner"
import { RequestQueueSkeleton } from "../sections/request-queue-skeleton"
import { RequestDetail } from "../sections/request-detail"
import { SensitiveDataBar } from "@/modules/shared/ui/components/custom/sensitive-data"
import { MedicalEmergencyBadge, PriorityBadge, RequestStatusBadge } from "../sections/request-status-badge"

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })

/** Agents' queue (F22): filter by status, "N en attente" counter (D17), processing with a comment. */
export function RequestQueuePage() {
  const detailRef = useRef<HTMLElement>(null)
  const [status, setStatus] = useState<RequestStatus | null>(null)
  const [priority, setPriority] = useState<RequestPriority | null>(null)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reveal, setReveal] = useState(false)
  // F70 : chaque affichage des données sensibles est journalisé ; pas de rafraîchissement périodique dans ce mode.
  const queue = useListRequestQueueQuery({ status, page, reveal, priority }, { pollingInterval: reveal ? 0 : REQUEST_QUEUE_POLLING_MS })
  const data = queue.currentData
  const showSkeleton = queue.isFetching && (!data || data.items.length === 0)
  const selected = data?.items.find(item => item.id === selectedId) ?? null
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  useEffect(() => {
    if (selectedId) detailRef.current?.focus()
  }, [selectedId])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
            Demandes citoyennes
            {data && (
              <StatusBadge tone={data.pendingCount > 0 ? "pending" : "success"} label={`${data.pendingCount} en attente`} size="md" />
            )}
            {data && data.urgentCount > 0 && (
              <StatusBadge tone="danger" label={`${data.urgentCount} urgente${data.urgentCount > 1 ? "s" : ""}`} size="md" />
            )}
          </h1>
          <p className="mt-1 text-muted-foreground">Messages et signalements envoyés par les habitants, les plus prioritaires puis les plus anciens d’abord. Mise à jour en temps réel.</p>
        </div>
        <Button type="button" variant="outline" disabled={queue.isFetching} onClick={() => void queue.refetch()}>
          <RefreshCw aria-hidden="true" className={queue.isFetching ? "animate-spin" : undefined} /> Actualiser
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">{data ? `${data.pendingCount} demande(s) en attente de prise en charge, ${data.urgentCount} urgente(s)` : ""}</p>

      {data && <EmergencyBanner emergencies={data.pendingEmergencies ?? []} canProcess={data.canProcess} onOpen={id => { setStatus(null); setPriority(null); setPage(1); setSelectedId(id) }} />}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1">
          <Label htmlFor="filter-status">État</Label>
          <select
            id="filter-status"
            className={selectClass}
            value={status ?? "all"}
            onChange={event => {
              setStatus(event.target.value === "all" ? null : event.target.value as RequestStatus)
              setPage(1)
              setSelectedId(null)
            }}
          >
            <option value="all">Tous les états</option>
            {REQUEST_STATUSES.map(option => <option key={option} value={option}>{STATUS_LABELS[option]}</option>)}
          </select>
        </div>
        <div className="w-48 space-y-1">
          <Label htmlFor="filter-priority">Priorité</Label>
          <select
            id="filter-priority"
            className={selectClass}
            value={priority ?? "all"}
            onChange={event => {
              setPriority(event.target.value === "all" ? null : event.target.value as RequestPriority)
              setPage(1)
              setSelectedId(null)
            }}
          >
            <option value="all">Toutes les priorités</option>
            {PRIORITIES.map(option => <option key={option} value={option}>{PRIORITY_LABELS[option]}</option>)}
          </select>
        </div>
        {data && <p className="pb-2 text-sm text-muted-foreground" role="status">{data.total} demande(s)</p>}
      </div>

      <SensitiveDataBar meta={data?.sensitive} revealed={reveal} onChange={setReveal} busy={queue.isFetching} />

      {queue.error ? (
        <div role="alert" className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{getErrorMessage(queue.error)}</p>
          <Button type="button" variant="outline" disabled={queue.isFetching} onClick={() => void queue.refetch()}>Réessayer</Button>
        </div>
      ) : null}

      {showSkeleton && <RequestQueueSkeleton />}

      {data && !showSkeleton && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="queue-title" className="space-y-3">
            <h2 id="queue-title" className="sr-only">Liste des demandes</h2>
            {data.items.length === 0 ? (
              <p role="status" className="rounded-2xl bg-white p-6 text-sm text-muted-foreground shadow-sm">
                {status === "submitted" ? "Aucune demande en attente de prise en charge." : "Aucune demande pour ce filtre."}
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Demandes, par priorité puis les plus anciennes d’abord">
                {data.items.map(item => {
                  const isSelected = item.id === selectedId
                  const Icon = item.type === "report" ? Megaphone : MessageSquare
                  return <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => { if (isSelected) detailRef.current?.focus(); else setSelectedId(item.id) }}
                      aria-pressed={isSelected}
                      aria-controls="selected-request"
                      aria-label={`${isSelected ? "Voir le détail" : "Voir la demande"} ${item.reference} : ${item.subject}`}
                      className={`group w-full rounded-2xl p-5 text-left transition ${isSelected ? "bg-teal-50 shadow-sm" : "bg-white shadow-sm hover:bg-teal-50/60 hover:shadow-md"}`}
                    >
                      <span className="flex items-start gap-3">
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="size-5" aria-hidden="true" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-slate-500">{TYPE_LABELS[item.type]} · {item.reference}</span>
                          <span className="mt-1 block break-words text-base font-semibold text-slate-950">{item.subject}</span>
                        </span>
                      </span>
                      <span className="mt-4 flex flex-wrap items-center gap-2">
                        <RequestStatusBadge status={item.status} />
                        <PriorityBadge priority={item.priority} />
                        {item.medicalEmergency && <MedicalEmergencyBadge handled={Boolean(item.emergencyHandledAt)} />}
                        <span className="text-xs text-slate-500">Reçue le <time dateTime={item.createdAt}>{dateTime.format(new Date(item.createdAt))}</time></span>
                      </span>
                      <span className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-teal-800">
                        {isSelected ? <><span className="inline-flex items-center gap-2"><Check className="size-4" aria-hidden="true" />Demande ouverte</span><span>Voir le détail</span></> : <><span>Voir la demande</span><ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></>}
                      </span>
                    </button>
                  </li>
                })}
              </ul>
            )}
            {pages > 1 && (
              <nav aria-label="Pages de la file" className="flex items-center gap-3 text-sm">
                <Button type="button" variant="outline" size="sm" disabled={queue.isFetching || page <= 1} onClick={() => setPage(page - 1)}>Précédente</Button>
                <span>Page {page} sur {pages}</span>
                <Button type="button" variant="outline" size="sm" disabled={queue.isFetching || page >= pages} onClick={() => setPage(page + 1)}>Suivante</Button>
              </nav>
            )}
          </section>
          <aside id="selected-request" ref={detailRef} tabIndex={-1} aria-label="Demande sélectionnée" className="scroll-mt-6 self-start outline-none">
            {selected ? (
              <RequestDetail request={selected} canProcess={data.canProcess} />
            ) : (
              <div className="rounded-2xl bg-slate-100/80 px-6 py-12 text-center text-sm text-slate-600">
                <Inbox className="mx-auto mb-4 size-9 text-slate-400" aria-hidden="true" />
                {selectedId ? "Cette demande n’apparaît plus avec ce filtre (son état a changé)." : "Cliquez sur « Voir la demande » pour consulter son détail et les actions disponibles."}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
