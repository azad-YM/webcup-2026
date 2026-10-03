import type { ReactNode } from "react"
import { Link } from "react-router"
import { RefreshCw } from "@boilerplate/shared-ui/components/icon"
import { Button } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { ACTIVITY_POLLING_MS, useGetActivityDashboardQuery } from "../../core/application/rtk-api/pilotage"
import { REQUEST_STATUS_LABELS, waitingAge } from "../../core/domain/activity-dashboard"

const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })

type FigureProps = { label: string; value: number; hint?: string; tone?: "warn" | "alert"; to?: string }

function Figure({ label, value, hint, tone, to }: FigureProps) {
  const color = tone === "alert" && value > 0 ? "text-red-700" : tone === "warn" && value > 0 ? "text-amber-700" : "text-slate-900"
  const body = (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
    </>
  )
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      {to ? <Link to={to} className="block rounded focus-visible:outline-2 focus-visible:outline-ring"><dl>{body}</dl></Link> : <dl>{body}</dl>}
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  const id = `block-${title.replace(/\W+/g, "-")}`
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  )
}

export function ActivityDashboardPage() {
  const query = useGetActivityDashboardQuery(undefined, { pollingInterval: ACTIVITY_POLLING_MS, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true })
  const data = query.data
  const recent = data ? `sur les ${data.recentHours} dernières heures` : ""
  const age = data ? waitingAge(data.requests.oldestWaitingSince, new Date(data.generatedAt)) : null

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord de l’activité</h1>
          <p className="mt-1 text-muted-foreground">Les chiffres clés de la plateforme, actualisés toutes les minutes.</p>
        </div>
        <div className="flex items-center gap-3">
          {data && <p className="text-sm text-muted-foreground" role="status">{query.isFetching ? "Actualisation…" : `Chiffres de ${timeFormat.format(new Date(data.generatedAt))}`}</p>}
          <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            <RefreshCw className={query.isFetching ? "animate-spin" : undefined} /> Actualiser
          </Button>
        </div>
      </div>

      {query.isError && (
        <div role="alert" className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{data ? `La dernière actualisation a échoué : ${getErrorMessage(query.error)} Les chiffres affichés datent de la lecture précédente.` : getErrorMessage(query.error)}</p>
          <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      )}
      {!data && query.isLoading && <p role="status">Chargement du tableau de bord…</p>}

      {data && (
        <>
          <Block title="Demandes citoyennes">
            <Figure label="En attente de prise en charge" value={data.requests.waiting} tone="warn" hint={age ? `La plus ancienne attend depuis ${age}` : "Aucune demande en attente"} to="/demandes" />
            <Figure label="Ouvertes (à traiter)" value={data.requests.open} to="/demandes" />
            <Figure label="Nouvelles demandes" value={data.requests.recent} hint={recent} />
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="text-sm text-muted-foreground">Par état</h3>
              <dl className="mt-2 space-y-1 text-sm">
                {Object.entries(data.requests.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between gap-2">
                    <dt>{REQUEST_STATUS_LABELS[status] ?? status}</dt>
                    <dd className="font-medium tabular-nums">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Block>

          <Block title="Habitants et information">
            <Figure label="Citoyens inscrits (actifs)" value={data.citizens.active} hint={`${data.citizens.recent} nouvelle(s) inscription(s) ${recent}`} />
            <Figure label="Alertes en cours" value={data.communication.activeAlerts} tone={data.communication.criticalAlerts > 0 ? "alert" : undefined} hint={`${data.communication.criticalAlerts} critique(s) · ${data.communication.scheduledAlerts} programmée(s)`} to="/contenus/alertes" />
            <Figure label="Publications en ligne" value={data.communication.publishedPublications} hint={`${data.communication.draftPublications} brouillon(s)`} to="/contenus" />
            <Figure label="Services perturbés" value={data.administration.disruptedServices} tone="warn" hint={`sur ${data.administration.services} service(s)`} to="/contenus/services" />
          </Block>

          <Block title="Comptes et sécurité">
            <Figure label="Comptes suspendus" value={data.security.suspendedAccounts} hint={`dont ${data.citizens.suspended} compte(s) citoyen(s)`} />
            <Figure label="Connexions bloquées" value={data.security.blockedLogins} tone="alert" hint={recent} />
            <Figure label="Membres actifs de l’administration" value={data.administration.activeMembers} />
          </Block>
        </>
      )}
    </div>
  )
}
