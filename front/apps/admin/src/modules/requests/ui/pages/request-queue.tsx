import { useState } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { RefreshCw } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { Button, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@boilerplate/shared-ui/components"
import { REQUEST_QUEUE_POLLING_MS, useListRequestQueueQuery } from "../../core/application/rtk-api/requests"
import { REQUEST_STATUSES, STATUS_LABELS, TYPE_LABELS, type RequestStatus } from "../../core/domain/service-request"
import { RequestDetail } from "../sections/request-detail"
import { RequestStatusBadge } from "../sections/request-status-badge"

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })

/** Agents' queue (F22): filter by status, "N en attente" counter (D17), processing with a comment. */
export function RequestQueuePage() {
  const [status, setStatus] = useState<RequestStatus | null>("submitted")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queue = useListRequestQueueQuery({ status, page }, { pollingInterval: REQUEST_QUEUE_POLLING_MS })
  const data = queue.data
  const selected = data?.items.find(item => item.id === selectedId) ?? null
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
            Demandes citoyennes
            {data && (
              <StatusBadge tone={data.pendingCount > 0 ? "pending" : "success"} label={`${data.pendingCount} en attente`} size="md" />
            )}
          </h1>
          <p className="mt-1 text-muted-foreground">Messages et signalements envoyés par les habitants. Mise à jour en temps réel.</p>
        </div>
        <Button type="button" variant="outline" disabled={queue.isFetching} onClick={() => void queue.refetch()}>
          <RefreshCw aria-hidden="true" className={queue.isFetching ? "animate-spin" : undefined} /> Actualiser
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">{data ? `${data.pendingCount} demande(s) en attente de prise en charge` : ""}</p>

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
        {data && <p className="pb-2 text-sm text-muted-foreground" role="status">{data.total} demande(s)</p>}
      </div>

      {queue.error ? (
        <div role="alert" className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{getErrorMessage(queue.error)}</p>
          <Button type="button" variant="outline" disabled={queue.isFetching} onClick={() => void queue.refetch()}>Réessayer</Button>
        </div>
      ) : null}

      {!data && queue.isLoading && <p role="status">Chargement des demandes…</p>}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <section aria-labelledby="queue-title" className="space-y-3">
            <h2 id="queue-title" className="sr-only">Liste des demandes</h2>
            {data.items.length === 0 ? (
              <p role="status" className="rounded-2xl bg-white p-6 text-sm text-muted-foreground shadow-sm">
                {status === "submitted" ? "Aucune demande en attente de prise en charge." : "Aucune demande pour ce filtre."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <Table>
                  <caption className="sr-only">Demandes citoyennes, les plus anciennes d’abord</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">N° de suivi</TableHead>
                      <TableHead scope="col">Objet</TableHead>
                      <TableHead scope="col">Type</TableHead>
                      <TableHead scope="col">Reçue le</TableHead>
                      <TableHead scope="col">État</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map(item => (
                      <TableRow key={item.id} className={item.id === selectedId ? "bg-sky-50 outline-2 -outline-offset-2 outline-sky-800" : undefined}>
                        <TableCell className="font-mono text-xs">{item.reference}</TableCell>
                        <TableCell>
                          <button type="button" className="text-left font-medium underline-offset-4 hover:underline" aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)}>
                            {item.subject}
                          </button>
                        </TableCell>
                        <TableCell>{TYPE_LABELS[item.type]}</TableCell>
                        <TableCell><time dateTime={item.createdAt}>{dateTime.format(new Date(item.createdAt))}</time></TableCell>
                        <TableCell><RequestStatusBadge status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {pages > 1 && (
              <nav aria-label="Pages de la file" className="flex items-center gap-3 text-sm">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédente</Button>
                <span>Page {page} sur {pages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Suivante</Button>
              </nav>
            )}
          </section>
          <aside aria-label="Demande sélectionnée">
            {selected ? (
              <RequestDetail request={selected} canProcess={data.canProcess} />
            ) : (
              <p className="rounded-2xl border border-dashed bg-white p-6 text-sm text-muted-foreground">
                {selectedId ? "Cette demande n’apparaît plus avec ce filtre (son état a changé)." : "Sélectionnez une demande pour la lire et la traiter."}
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
