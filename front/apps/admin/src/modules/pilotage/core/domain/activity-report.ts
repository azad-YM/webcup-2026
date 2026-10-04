/**
 * F98 : services les plus utilisés ; F103 : rapport synthétique de l’activité (`GET /pilotage/service-usage`,
 * `GET /pilotage/activity-report`, permission `admin.pilotage.read`). Comptes seulement, aucune donnée personnelle.
 * Les constats et recommandations sont calculés par le serveur à partir de règles explicites.
 */
export type ReportPeriodChoice = { days: number } | { from: string; to: string }

export type Period = { from: string; to: string; days: number; previousFrom: string }
export type Tone = "info" | "success" | "warning" | "danger" | "neutral"

export type ServiceUsageRow = {
  rank: number
  serviceId: string
  name: string
  category: string | null
  status: "available" | "maintenance" | "incident" | "disabled" | "unknown"
  uses: number
  requests: number
  appointments: number
  citizens: number
  share: number
  previousUses: number
  trend: number | null
  reviews: number
  averageRating: number | null
  needMetShare: number | null
}

export type UsageInsight = { tone: Tone; title: string; detail: string; action?: string }

export type ServiceUsageReport = {
  generatedAt: string
  period: Period
  totals: { uses: number; previousUses: number; requests: number; appointments: number; servicesUsed: number; servicesInCatalogue: number }
  services: ServiceUsageRow[]
  insights: UsageInsight[]
  unused: string[]
}

export type ReportFigure = { key: string; label: string; value: number | null; previous: number | null; trend: number | null }

export type ActivityReport = {
  generatedAt: string
  period: Period
  figures: ReportFigure[]
  keyPoints: { tone: Tone; text: string }[]
  recommendations: string[]
  sections: {
    requests: { received: number; resolved: number; rejected: number; waiting: number; urgent: number; handledShare: number | null; averageHoursToAcknowledge: number | null; appointments: number; concerns: number }
    services: { top: ServiceUsageRow[]; insights: UsageInsight[]; unused: string[] }
    communication: { alerts: number; criticalAlerts: number; publications: number; officialMessages: number }
    participation: { contributions: number; ideas: number; reviews: number; averageRating: number | null }
    security: { blockedLogins: number; suspendedAccounts: number }
  }
}

export const PERIOD_CHOICES = [
  { days: 7, label: "7 derniers jours" },
  { days: 30, label: "30 derniers jours" },
  { days: 90, label: "3 derniers mois" },
] as const

export const SERVICE_STATUS_LABELS: Record<ServiceUsageRow["status"], string> = {
  available: "Disponible",
  maintenance: "En maintenance",
  incident: "Perturbé",
  disabled: "Désactivé",
  unknown: "Hors catalogue",
}

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" })

export const formatPeriod = (period: Period) => `du ${dayFormat.format(new Date(period.from))} au ${dayFormat.format(new Date(period.to))}`
export const formatGeneratedAt = (iso: string) => dateTimeFormat.format(new Date(iso))

/** « +25 % », « −10 % », « = » ou `null` sans base de comparaison. */
export function formatTrend(trend: number | null): string | null {
  if (trend === null) return null
  const percent = Math.round(trend * 100)
  if (percent === 0) return "="
  return `${percent > 0 ? "+" : "−"}${Math.abs(percent)} %`
}

export const formatPercent = (share: number | null) => (share === null ? "—" : `${Math.round(share * 100)} %`)
export const formatRating = (rating: number | null) => (rating === null ? "—" : `${rating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5`)

export const periodQuery = (choice: ReportPeriodChoice) =>
  "days" in choice ? new URLSearchParams({ days: String(choice.days) }) : new URLSearchParams({ from: choice.from, to: choice.to })

const csvCell = (value: string | number | null) => {
  const text = value === null ? "" : String(value)
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** F98 : classement exportable (CSV séparé par des points-virgules, lisible par un tableur français). */
export function serviceUsageCsv(report: ServiceUsageReport): string {
  const header = ["Rang", "Service", "Usages", "Part", "Demandes", "Rendez-vous", "Habitants distincts", "Période précédente", "Évolution", "Avis", "Note moyenne", "État"]
  const rows = report.services.map((row) => [
    row.rank, row.name, row.uses, formatPercent(row.share), row.requests, row.appointments, row.citizens, row.previousUses,
    formatTrend(row.trend) ?? "", row.reviews, row.averageRating, SERVICE_STATUS_LABELS[row.status],
  ])
  return [header, ...rows].map((cells) => cells.map(csvCell).join(";")).join("\n")
}

/** F103 : rapport en Markdown, à transmettre tel quel (e-mail, wiki) ou à convertir. */
export function activityReportMarkdown(report: ActivityReport): string {
  const s = report.sections
  const lines = [
    `# Rapport d’activité de Nova Terra`,
    "",
    `Période ${formatPeriod(report.period)} (${report.period.days} jours) — établi le ${formatGeneratedAt(report.generatedAt)}.`,
    "",
    "## À retenir",
    ...report.keyPoints.map((point) => `- ${point.text}`),
    "",
    "## Actions recommandées",
    ...report.recommendations.map((action) => `- ${action}`),
    "",
    "## Chiffres clés",
    "",
    "| Indicateur | Période | Période précédente | Évolution |",
    "|---|---:|---:|---:|",
    ...report.figures.map((figure) => `| ${figure.label} | ${figure.value ?? "—"} | ${figure.previous ?? "—"} | ${formatTrend(figure.trend) ?? "—"} |`),
    "",
    "## Demandes des habitants",
    `- Reçues : ${s.requests.received} · résolues : ${s.requests.resolved} · refusées : ${s.requests.rejected} · en attente : ${s.requests.waiting} · urgentes : ${s.requests.urgent}`,
    `- Rendez-vous pris : ${s.requests.appointments} · inquiétudes exprimées : ${s.requests.concerns}`,
    "",
    "## Services les plus utilisés",
    ...s.services.top.map((row) => `${row.rank}. ${row.name} — ${row.uses} usages (${formatPercent(row.share)}), ${row.citizens} habitants${row.averageRating === null ? "" : `, note ${formatRating(row.averageRating)}`}`),
    ...(s.services.unused.length > 0 ? ["", `Services sans usage : ${s.services.unused.join(", ")}.`] : []),
    "",
    "## Information des habitants",
    `- ${s.communication.alerts} alertes (dont ${s.communication.criticalAlerts} urgentes), ${s.communication.publications} publications, ${s.communication.officialMessages} messages officiels.`,
    "",
    "## Participation",
    `- ${s.participation.contributions} réponses aux consultations, ${s.participation.ideas} idées, ${s.participation.reviews} avis sur les services (note moyenne ${formatRating(s.participation.averageRating)}).`,
    "",
    "## Sécurité",
    `- ${s.security.blockedLogins} connexions suspectes bloquées ; ${s.security.suspendedAccounts} comptes suspendus à ce jour.`,
  ]
  return lines.join("\n")
}
