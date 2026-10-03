import type { WebcupFeed } from "../../../core/domain/webcup-feed"
import { formatCountdown, formatElapsed } from "../../../core/domain/webcup-feed"

type Props = {
  feed: WebcupFeed
  countdown: number | null
}

const numberFormat = new Intl.NumberFormat("fr-FR")

export function SessionSummary({ feed, countdown }: Props) {
  const { session } = feed
  const stats = [
    { label: "Vague actuelle", value: session.currentWave === null ? "—" : session.currentWave === 0 ? "Initiale" : String(session.currentWave) },
    { label: "Temps écoulé", value: formatElapsed(session.elapsedMinutes) },
    {
      label: "Prochaine vague",
      value: session.hasNextWave && session.nextWaveNumber !== null ? `Vague ${session.nextWaveNumber}` : "Aucune annoncée",
      hint: countdown !== null ? `dans ≈ ${formatCountdown(countdown)} (indicatif)` : undefined,
    },
    { label: "Demandes visibles", value: numberFormat.format(session.requestsCount) },
    { label: "XP disponibles", value: numberFormat.format(session.totalXpAvailable) },
  ]

  return (
    <section aria-labelledby="session-title" className="space-y-3">
      <h2 id="session-title" className="sr-only">État de la session</h2>
      <p className="text-sm text-muted-foreground">
        Session {session.isRunning ? "en cours" : "à l’arrêt"}{session.status ? ` (${session.status})` : ""}
      </p>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{stat.value}</dd>
            {stat.hint && <dd className="mt-1 text-xs text-muted-foreground">{stat.hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  )
}
