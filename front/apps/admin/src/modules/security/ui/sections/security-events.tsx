import { Link } from "react-router"
import { ArrowRight, ShieldAlert, ShieldCheck } from "@boilerplate/shared-ui/components/icon"
import { Button } from "@boilerplate/shared-ui/components"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useSecurityEventsQuery } from "../../core/application/rtk-api/operations"
import { SECURITY_EVENT_SEVERITY_LABELS, type SecurityEvent } from "../../core/domain/operations"

const TONES: Record<SecurityEvent["severity"], StatusTone> = { info: "info", warning: "warning", critical: "danger" }
const STATUS_LABELS = { new: "Nouvelle", seen: "Vue", handled: "Traitée" } as const
const timeFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

/** « il y a 5 min », « il y a 3 h », sinon la date. */
function when(iso: string, now: number): string {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000)
  if (minutes < 1) return "à l’instant"
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 24 * 60) return `il y a ${Math.round(minutes / 60)} h`
  return timeFormat.format(new Date(iso))
}

function EventItem({ event, now, compact }: { event: SecurityEvent; now: number; compact: boolean }) {
  return (
    <li className={`rounded-xl border bg-white p-4 ${event.severity === "critical" ? "border-red-300" : event.severity === "warning" ? "border-amber-300" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={TONES[event.severity]} label={SECURITY_EVENT_SEVERITY_LABELS[event.severity]} srPrefix="Gravité :" />
        {event.status && <StatusBadge tone={event.status === "handled" ? "success" : "pending"} label={STATUS_LABELS[event.status]} srPrefix="Suivi :" />}
        <time dateTime={event.occurredAt} className="text-xs text-muted-foreground">{when(event.occurredAt, now)}</time>
      </div>
      <p className="mt-1 font-semibold">{event.title}</p>
      <p className="text-sm text-slate-700">{event.description}</p>
      {!compact && <p className="mt-1 text-xs text-muted-foreground">Par : {event.actor}</p>}
      <p className={`mt-2 text-sm ${event.toReview ? "font-medium text-red-900" : "text-slate-800"}`}><span className="font-medium">Que faire : </span>{event.whatToDo}</p>
      {event.link && <Link to={event.link} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-teal-800 underline">Voir le détail <ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
    </li>
  )
}

/**
 * F100 : derniers événements de sécurité, en clair (quoi, gravité, que faire), mis à jour en direct (anomalie grave)
 * et toutes les 2 minutes. `compact` : bloc de l’accueil de l’espace de travail (5 événements, lien vers la page).
 */
export function SecurityEvents({ compact = false }: { compact?: boolean }) {
  const feed = useSecurityEventsQuery(compact ? 5 : 30, { pollingInterval: 120_000, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true })
  const data = feed.data
  const now = data ? Date.parse(data.generatedAt) : Date.now()
  const calm = data && data.summary.toReview === 0 && data.summary.critical24h === 0
  return (
    <section aria-labelledby="titre-evenements-securite" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="titre-evenements-securite" className={`flex items-center gap-2 font-semibold ${compact ? "text-lg" : "text-xl"}`}>
          {calm ? <ShieldCheck className="size-5 text-emerald-700" aria-hidden="true" /> : <ShieldAlert className="size-5 text-red-700" aria-hidden="true" />}
          Derniers événements de sécurité
        </h2>
        {compact && <Link to="/securite" className="text-sm font-medium text-teal-800 underline">Tous les événements</Link>}
      </div>
      {feed.error ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{getErrorMessage(feed.error)}</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void feed.refetch()}>Réessayer</Button>
        </div>
      ) : !data ? (
        <p role="status" className="text-sm text-muted-foreground">Chargement des événements…</p>
      ) : (
        <>
          <p role="status" className={`rounded-xl border-s-4 p-3 text-sm font-medium ${calm ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-red-600 bg-red-50 text-red-950"}`}>
            {data.summary.headline}
          </p>
          {data.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Rien à signaler sur les {data.days} derniers jours.</p>
          ) : (
            <ul className="space-y-2" aria-live="polite">{data.events.map((event) => <EventItem key={event.id} event={event} now={now} compact={compact} />)}</ul>
          )}
          {!data.detailed && <p className="text-xs text-muted-foreground">Les comptes et adresses concernés sont masqués : seuls les responsables de la sécurité voient les détails.</p>}
        </>
      )}
    </section>
  )
}
