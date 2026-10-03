import { RefreshCw } from "@boilerplate/shared-ui/components/icon"
import { Button, Label } from "@boilerplate/shared-ui/components"
import { RequestTable } from "../sections/webcup-feed/request-table"
import { SessionSummary } from "../sections/webcup-feed/session-summary"
import { useWebcupFeed } from "../sections/webcup-feed/use-webcup-feed"
import { TRACKING_LABELS, waveLabel, type TrackingStatus } from "../../core/domain/webcup-feed"

const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"

export function WebcupFeedPage() {
  const page = useWebcupFeed()
  const { feed, data } = page

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Flux Nova Terra</h1>
          <p className="mt-1 text-muted-foreground">Demandes de la ville transmises par l’API du concours. Actualisation automatique toutes les 30 secondes.</p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <p className="text-sm text-muted-foreground" role="status">
              {feed.isFetching ? "Actualisation…" : `Données lues à ${timeFormat.format(new Date(data.fetchedAt))}`}
            </p>
          )}
          <Button type="button" variant="outline" disabled={feed.isFetching} onClick={() => void feed.refetch()}>
            <RefreshCw className={feed.isFetching ? "animate-spin" : undefined} /> Actualiser
          </Button>
        </div>
      </div>

      {page.error && (
        <div role="alert" className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{data ? `La dernière actualisation a échoué : ${page.error} Les données affichées datent de la lecture précédente.` : page.error}</p>
          <Button type="button" variant="outline" disabled={feed.isFetching} onClick={() => void feed.refetch()}>Réessayer</Button>
        </div>
      )}

      {!data && feed.isLoading && <p role="status">Chargement du flux…</p>}

      {data && (
        <>
          <SessionSummary feed={data} countdown={page.countdown} />

          <section aria-labelledby="tracking-title" className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 id="tracking-title" className="text-lg font-semibold">Suivi de l’équipe</h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-4">
              <div><dt className="text-sm text-muted-foreground">XP des demandes faites</dt><dd className="text-2xl font-semibold tabular-nums">{page.totals.done}</dd></div>
              <div><dt className="text-sm text-muted-foreground">XP restants</dt><dd className="text-2xl font-semibold tabular-nums">{page.totals.remaining}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Demandes faites</dt><dd className="text-2xl font-semibold tabular-nums">{page.totals.doneCount}</dd></div>
              <div><dt className="text-sm text-muted-foreground">En cours / à faire</dt><dd className="text-2xl font-semibold tabular-nums">{page.totals.inProgressCount} / {page.totals.todoCount}</dd></div>
            </dl>
            {!data.canEditTracking && <p className="mt-3 text-sm text-muted-foreground">Lecture seule : seul un administrateur (permission admin.pilotage.write) modifie le suivi.</p>}
          </section>

          <section aria-labelledby="requests-title" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="requests-title" className="text-lg font-semibold">Demandes</h2>
                <p className="text-sm text-muted-foreground" role="status">
                  {page.visibleRequests.length} affichée(s) sur {data.requests.length}
                  {page.newCodes.size > 0 ? ` · ${page.newCodes.size} nouvelle(s) depuis votre dernière consultation` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-44 space-y-1">
                  <Label htmlFor="filter-wave">Vague</Label>
                  <select id="filter-wave" className={selectClass} value={page.filters.wave} onChange={event => page.setWave(event.target.value)}>
                    <option value="all">Toutes les vagues</option>
                    {page.waves.map(wave => <option key={wave} value={wave}>{waveLabel(wave)}</option>)}
                  </select>
                </div>
                <div className="w-44 space-y-1">
                  <Label htmlFor="filter-difficulty">Difficulté</Label>
                  <select id="filter-difficulty" className={selectClass} value={page.filters.difficulty} onChange={event => page.setDifficulty(event.target.value)}>
                    <option value="all">Toutes</option>
                    {page.difficulties.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="w-44 space-y-1">
                  <Label htmlFor="filter-tracking">Suivi</Label>
                  <select id="filter-tracking" className={selectClass} value={page.filters.tracking ?? "all"} onChange={event => page.setTracking(event.target.value as "all" | TrackingStatus)}>
                    <option value="all">Tous</option>
                    {(Object.keys(TRACKING_LABELS) as TrackingStatus[]).map(status => <option key={status} value={status}>{status === "done" ? "Faits" : TRACKING_LABELS[status]}</option>)}
                  </select>
                </div>
                {page.newCodes.size > 0 && (
                  <Button type="button" variant="ghost" onClick={page.acknowledgeAll}>Tout marquer comme vu</Button>
                )}
              </div>
            </div>
            {data.requests.length === 0 ? (
              <p role="status" className="rounded-2xl bg-white p-6 text-sm text-muted-foreground shadow-sm">Aucune demande n’a encore été diffusée.</p>
            ) : page.visibleRequests.length === 0 ? (
              <p role="status" className="rounded-2xl bg-white p-6 text-sm text-muted-foreground shadow-sm">Aucune demande ne correspond à ces filtres.</p>
            ) : (
              <RequestTable requests={page.visibleRequests} newCodes={page.newCodes} canEditTracking={data.canEditTracking} />
            )}
          </section>
        </>
      )}
    </div>
  )
}
