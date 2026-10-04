import { useState } from "react"
import { Download, RefreshCw } from "@boilerplate/shared-ui/components/icon"
import { Button } from "@boilerplate/shared-ui/components"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useDownloadReportFileMutation, useGetServiceUsageQuery } from "../../core/application/rtk-api/pilotage"
import {
  formatGeneratedAt,
  formatPercent,
  formatPeriod,
  formatRating,
  formatTrend,
  SERVICE_STATUS_LABELS,
  serviceUsageCsv,
  type ReportPeriodChoice,
  type ServiceUsageRow,
} from "../../core/domain/activity-report"
import { ReportPeriodPicker, TONE_CLASSES } from "../sections/report-period"

const STATUS_TONES = { available: "success", maintenance: "warning", incident: "danger", disabled: "danger", unknown: "neutral" } as const

/** Barre horizontale proportionnelle à la part du service (graphique accessible : la valeur est écrite). */
function UsageBar({ row, max }: { row: ServiceUsageRow; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-3 rounded-full bg-teal-600" style={{ width: `${max === 0 ? 0 : Math.max(2, (row.uses / max) * 100)}%` }} />
      </div>
      <span className="w-24 text-end text-sm tabular-nums">{row.uses} · {formatPercent(row.share)}</span>
    </div>
  )
}

/**
 * F98 : quels services les habitants utilisent le plus. Classement (usages = demandes + rendez-vous), part de
 * chaque service, habitants distincts, évolution par rapport à la période précédente, satisfaction (avis), et
 * « À retenir » : ce que ces chiffres disent et ce qu’il faudrait faire. Export CSV pour un tableur.
 */
export function ServiceUsagePage() {
  const [period, setPeriod] = useState<ReportPeriodChoice>({ days: 30 })
  const query = useGetServiceUsageQuery(period, { refetchOnMountOrArgChange: true })
  const [download] = useDownloadReportFileMutation()
  const data = query.data
  const max = data?.services[0]?.uses ?? 0
  const trend = data ? formatTrend(data.totals.previousUses === 0 ? null : (data.totals.uses - data.totals.previousUses) / data.totals.previousUses) : null
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Services les plus utilisés</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">Usages = demandes et signalements adressés au service, plus les rendez-vous pris. Les avis des habitants indiquent la satisfaction.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw className="size-4" aria-hidden="true" /> Actualiser</Button>
          <Button type="button" disabled={!data} onClick={() => data && void download({ fileName: `services-les-plus-utilises-${data.period.to.slice(0, 10)}.csv`, mimeType: "text/csv;charset=utf-8", content: `\uFEFF${serviceUsageCsv(data)}` })}>
            <Download className="size-4" aria-hidden="true" /> Exporter (CSV)
          </Button>
        </div>
      </div>
      <ReportPeriodPicker value={period} onChange={setPeriod} />
      {query.error ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{getErrorMessage(query.error)}</p>
          <Button type="button" variant="outline" className="mt-2" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      ) : !data ? (
        <p role="status" className="text-sm text-muted-foreground">Calcul du classement…</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Période {formatPeriod(data.period)} · calculé le {formatGeneratedAt(data.generatedAt)}</p>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm"><dt className="text-sm text-muted-foreground">Usages des services</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{data.totals.uses}</dd>{trend && <dd className="text-xs text-muted-foreground">{trend} par rapport à la période précédente ({data.totals.previousUses})</dd>}</div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><dt className="text-sm text-muted-foreground">Demandes</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{data.totals.requests}</dd></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><dt className="text-sm text-muted-foreground">Rendez-vous</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{data.totals.appointments}</dd></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><dt className="text-sm text-muted-foreground">Services utilisés</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{data.totals.servicesUsed} <span className="text-base font-normal text-muted-foreground">/ {data.totals.servicesInCatalogue}</span></dd></div>
          </dl>
          <section aria-labelledby="titre-a-retenir" className="space-y-3">
            <h2 id="titre-a-retenir" className="text-lg font-semibold">À retenir</h2>
            <ul className="grid gap-3 lg:grid-cols-2">
              {data.insights.map((insight) => (
                <li key={insight.title} className={`rounded-xl border-s-4 p-4 ${TONE_CLASSES[insight.tone]}`}>
                  <p className="font-semibold">{insight.title}</p>
                  <p className="mt-1 text-sm">{insight.detail}</p>
                  {insight.action && <p className="mt-2 text-sm font-medium">À faire : {insight.action}</p>}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="titre-classement" className="space-y-3">
            <h2 id="titre-classement" className="text-lg font-semibold">Classement</h2>
            {data.services.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Aucun usage sur la période.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                <table className="w-full min-w-[56rem] text-sm">
                  <caption className="sr-only">Services classés par nombre d’usages sur la période</caption>
                  <thead className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="p-3 text-start">Rang</th>
                      <th scope="col" className="p-3 text-start">Service</th>
                      <th scope="col" className="w-64 p-3 text-start">Usages et part</th>
                      <th scope="col" className="p-3 text-end">Demandes</th>
                      <th scope="col" className="p-3 text-end">Rendez-vous</th>
                      <th scope="col" className="p-3 text-end">Habitants</th>
                      <th scope="col" className="p-3 text-end">Évolution</th>
                      <th scope="col" className="p-3 text-end">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.services.map((row) => (
                      <tr key={row.serviceId}>
                        <td className="p-3 font-semibold tabular-nums">{row.rank}</td>
                        <th scope="row" className="p-3 text-start font-medium">
                          {row.name}
                          {row.status !== "available" && <StatusBadge className="ms-2" tone={STATUS_TONES[row.status]} label={SERVICE_STATUS_LABELS[row.status]} srPrefix="État :" />}
                        </th>
                        <td className="p-3"><UsageBar row={row} max={max} /></td>
                        <td className="p-3 text-end tabular-nums">{row.requests}</td>
                        <td className="p-3 text-end tabular-nums">{row.appointments}</td>
                        <td className="p-3 text-end tabular-nums">{row.citizens}</td>
                        <td className="p-3 text-end tabular-nums">{formatTrend(row.trend) ?? <span className="text-muted-foreground">nouveau</span>}</td>
                        <td className="p-3 text-end tabular-nums">{formatRating(row.averageRating)}{row.reviews > 0 && <span className="block text-xs text-muted-foreground">{row.reviews} avis</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.unused.length > 0 && <p className="text-sm text-muted-foreground">Sans aucun usage sur la période : {data.unused.join(", ")}.</p>}
          </section>
        </>
      )}
    </div>
  )
}
