import { useState, type ReactNode } from "react"
import { Link } from "react-router"
import { Download, Printer } from "@boilerplate/shared-ui/components/icon"
import { Button } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useDownloadReportFileMutation, useGetActivityReportQuery } from "../../core/application/rtk-api/pilotage"
import {
  activityReportMarkdown,
  formatGeneratedAt,
  formatPercent,
  formatPeriod,
  formatRating,
  formatTrend,
  type ReportPeriodChoice,
} from "../../core/domain/activity-report"
import { ReportPeriodPicker, TONE_CLASSES } from "../sections/report-period"

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `rapport-${title.replace(/\W+/g, "-")}`
  return (
    <section aria-labelledby={id} className="break-inside-avoid space-y-2 rounded-2xl bg-white p-5 shadow-sm print:shadow-none">
      <h2 id={id} className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/**
 * F103 : rapport synthétique de l’activité, pour les responsables. D’abord ce qu’il faut retenir et faire,
 * puis les chiffres clés comparés à la période précédente, puis le détail par domaine. Imprimable et
 * téléchargeable en Markdown (à transmettre tel quel).
 */
export function ActivityReportPage() {
  const [period, setPeriod] = useState<ReportPeriodChoice>({ days: 30 })
  const query = useGetActivityReportQuery(period, { refetchOnMountOrArgChange: true })
  const [download] = useDownloadReportFileMutation()
  const report = query.data
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Rapport d’activité</h1>
          {report && <p className="mt-1 text-muted-foreground">Période {formatPeriod(report.period)} ({report.period.days} jours) · établi le {formatGeneratedAt(report.generatedAt)}</p>}
        </div>
        <div className="flex gap-2 print:hidden">
          <Button type="button" variant="outline" disabled={!report} onClick={() => window.print()}><Printer className="size-4" aria-hidden="true" /> Imprimer / PDF</Button>
          <Button type="button" disabled={!report} onClick={() => report && void download({ fileName: `rapport-activite-${report.period.to.slice(0, 10)}.md`, mimeType: "text/markdown;charset=utf-8", content: activityReportMarkdown(report) })}>
            <Download className="size-4" aria-hidden="true" /> Télécharger
          </Button>
        </div>
      </div>
      <ReportPeriodPicker value={period} onChange={setPeriod} />
      {query.error ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{getErrorMessage(query.error)}</p>
          <Button type="button" variant="outline" className="mt-2" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      ) : !report ? (
        <p role="status" className="text-sm text-muted-foreground">Préparation du rapport…</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Section title="À retenir">
              <ul className="space-y-2">
                {report.keyPoints.map((point) => <li key={point.text} className={`rounded-lg border-s-4 px-3 py-2 text-sm ${TONE_CLASSES[point.tone]}`}>{point.text}</li>)}
              </ul>
            </Section>
            <Section title="Actions recommandées">
              <ol className="list-decimal space-y-2 ps-5 text-sm">
                {report.recommendations.map((action) => <li key={action}>{action}</li>)}
              </ol>
            </Section>
          </div>
          <Section title="Chiffres clés">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.figures.map((figure) => (
                <div key={figure.key} className="rounded-xl border p-3">
                  <dt className="text-sm text-muted-foreground">{figure.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">{figure.value ?? "—"}</dd>
                  {figure.previous !== null && <dd className="text-xs text-muted-foreground">Période précédente : {figure.previous}{formatTrend(figure.trend) ? ` (${formatTrend(figure.trend)})` : ""}</dd>}
                </div>
              ))}
            </dl>
          </Section>
          <div className="grid gap-5 md:grid-cols-2">
            <Section title="Demandes des habitants">
              <p className="text-sm">{report.sections.requests.received} reçues · {report.sections.requests.resolved} résolues · {report.sections.requests.rejected} refusées · <strong>{report.sections.requests.waiting} en attente</strong> · {report.sections.requests.urgent} urgentes</p>
              <p className="text-sm text-muted-foreground">Part traitée : {formatPercent(report.sections.requests.handledShare)} · {report.sections.requests.appointments} rendez-vous · {report.sections.requests.concerns} inquiétudes</p>
              <Link to="/demandes" className="text-sm font-medium text-teal-800 underline print:hidden">Ouvrir la file des demandes</Link>
            </Section>
            <Section title="Services les plus utilisés">
              <ol className="space-y-1 text-sm">
                {report.sections.services.top.map((row) => <li key={row.serviceId}>{row.rank}. {row.name} — <strong>{row.uses}</strong> usages ({formatPercent(row.share)}){row.averageRating !== null ? `, ${formatRating(row.averageRating)}` : ""}</li>)}
              </ol>
              <Link to="/pilotage/services" className="text-sm font-medium text-teal-800 underline print:hidden">Voir le classement complet</Link>
            </Section>
            <Section title="Information des habitants">
              <p className="text-sm">{report.sections.communication.alerts} alertes (dont {report.sections.communication.criticalAlerts} urgentes) · {report.sections.communication.publications} publications · {report.sections.communication.officialMessages} messages officiels</p>
            </Section>
            <Section title="Participation et sécurité">
              <p className="text-sm">{report.sections.participation.contributions} réponses aux consultations · {report.sections.participation.ideas} idées · {report.sections.participation.reviews} avis (note {formatRating(report.sections.participation.averageRating)})</p>
              <p className="text-sm">{report.sections.security.blockedLogins} connexions suspectes bloquées · {report.sections.security.suspendedAccounts} comptes suspendus</p>
            </Section>
          </div>
        </div>
      )}
    </div>
  )
}
