import { useState } from "react"
import { Button } from "@boilerplate/shared-ui/components"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useAnomaliesQuery, useAnomalySummaryQuery, useChangeAnomalyStatusMutation, useScanAnomaliesMutation } from "../../core/application/rtk-api/operations"
import { ANOMALY_POLLING_MS, CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS, type Anomaly, type AnomalySeverity, type AnomalyStatus } from "../../core/domain/operations"
import { PlatformStatusCard } from "../sections/platform-status-card"

const SEVERITY_TONES: Record<AnomalySeverity, StatusTone> = { info: "info", warning: "warning", critical: "danger" }
const STATUS_TONES: Record<AnomalyStatus, StatusTone> = { new: "pending", seen: "progress", handled: "success" }

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—")

/** F85 : activité inhabituelle et informations incohérentes (`admin.security.read`). */
export function UnusualActivityPage() {
  const [status, setStatus] = useState<AnomalyStatus | null>(null)
  const [severity, setSeverity] = useState<AnomalySeverity | null>(null)
  const board = useAnomaliesQuery({ status, severity }, { pollingInterval: ANOMALY_POLLING_MS })
  const summary = useAnomalySummaryQuery()
  const [scan, scanState] = useScanAnomaliesMutation()
  const [changeStatus, changeState] = useChangeAnomalyStatusMutation()
  const counters = board.data?.counters

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Activité inhabituelle</h1>
        <p className="mt-2 text-muted-foreground">
          Toutes les 5 minutes, la plateforme compare l’activité à l’usage habituel : connexions refusées en série, appareils nouveaux en nombre,
          rafales d’envois, robots, actions d’agent hors norme, et données incohérentes. Chaque anomalie est expliquée ; les plus graves arrivent en direct
          et un compte attaqué est protégé automatiquement (verrouillage, code par e-mail, habitant prévenu).
        </p>
      </div>

      <PlatformStatusCard />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
        <Counter label="Graves à traiter" value={counters?.criticalOpen} emphasis />
        <Counter label="Nouvelles" value={counters?.new} />
        <Counter label="Envois de robots refusés (24 h)" value={board.data ? board.data.signals.formRejected + board.data.signals.formChallenged : undefined} hint={board.data ? `${board.data.signals.formRejected} refusés, ${board.data.signals.formChallenged} questions posées` : undefined} />
        <Counter label="Rafales freinées (24 h)" value={board.data?.signals.rateLimited} />
      </div>

      <section aria-labelledby="resume-jour" className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="resume-jour" className="font-semibold">Résumé des dernières 24 heures</h2>
          {summary.data && <StatusBadge tone={summary.data.source === "ai" ? "info" : "neutral"} label={summary.data.source === "ai" ? "Rédigé par l’assistant (IA)" : "Résumé automatique par règles"} />}
        </div>
        {summary.isLoading && <p role="status" className="mt-2 text-sm">Rédaction du résumé…</p>}
        {summary.isError && <p className="mt-2 text-sm">{getErrorMessage(summary.error)}</p>}
        {summary.data && <p className="mt-2">{summary.data.text}</p>}
        {summary.data?.source === "ai" && <p className="mt-1 text-xs text-muted-foreground">Le résumé est rédigé à partir des seules règles et compteurs, sans donnée personnelle. Vérifiez le détail ci-dessous avant d’agir.</p>}
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">Statut
          <select className="mt-1 block rounded-md border px-3 py-2" value={status ?? ""} onChange={(event) => setStatus((event.target.value || null) as AnomalyStatus | null)}>
            <option value="">Tous</option>
            {(Object.keys(STATUS_LABELS) as AnomalyStatus[]).map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
          </select>
        </label>
        <label className="block">Gravité
          <select className="mt-1 block rounded-md border px-3 py-2" value={severity ?? ""} onChange={(event) => setSeverity((event.target.value || null) as AnomalySeverity | null)}>
            <option value="">Toutes</option>
            {(Object.keys(SEVERITY_LABELS) as AnomalySeverity[]).map((value) => <option key={value} value={value}>{SEVERITY_LABELS[value]}</option>)}
          </select>
        </label>
        <Button type="button" disabled={scanState.isLoading} onClick={() => void scan()}>
          {scanState.isLoading ? "Analyse en cours…" : "Analyser maintenant"}
        </Button>
        <p className="text-sm text-muted-foreground" role="status">
          {scanState.data
            ? `Analyse terminée : ${scanState.data.detected} anomalie(s) observée(s), dont ${scanState.data.created} nouvelle(s).`
            : `Dernière analyse : ${when(board.data?.lastScanAt ?? null)}`}
        </p>
      </div>
      {scanState.isError && <p role="alert">{getErrorMessage(scanState.error)}</p>}
      {changeState.isError && <p role="alert">{getErrorMessage(changeState.error)}</p>}

      {board.isLoading && <div role="status" aria-label="Chargement des anomalies" className="space-y-3">{[0, 1, 2].map((key) => <div key={key} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>}
      {board.isError && <div role="alert"><p>{getErrorMessage(board.error)}</p><Button onClick={() => void board.refetch()} className="mt-3">Réessayer</Button></div>}
      {board.data && !board.isError && (board.data.items.length === 0
        ? <p role="status">Aucune anomalie{status || severity ? " pour ces filtres" : ""}. Rien d’inhabituel n’a été repéré.</p>
        : <ul className="space-y-3">{board.data.items.map((anomaly) => <AnomalyCard key={anomaly.id} anomaly={anomaly} busy={changeState.isLoading} onChange={(next) => void changeStatus({ id: anomaly.id, status: next })} />)}</ul>)}
    </section>
  )
}

function Counter({ label, value, hint, emphasis = false }: { label: string; value?: number; hint?: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${emphasis && value ? "border-red-700 bg-red-50 text-red-950" : "bg-card"}`}>
      <p className="text-sm">{label}</p>
      <p className="text-3xl font-semibold">{value ?? "—"}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function AnomalyCard({ anomaly, busy, onChange }: { anomaly: Anomaly; busy: boolean; onChange: (status: AnomalyStatus) => void }) {
  return (
    <li className={`rounded-xl border p-4 ${anomaly.severity === "critical" && anomaly.status !== "handled" ? "border-red-700" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={SEVERITY_TONES[anomaly.severity]} label={SEVERITY_LABELS[anomaly.severity]} srPrefix="Gravité : " />
        <StatusBadge tone={STATUS_TONES[anomaly.status]} label={STATUS_LABELS[anomaly.status]} srPrefix="Statut : " />
        <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[anomaly.category] ?? anomaly.category}</span>
      </div>
      <h2 className="mt-2 font-semibold">{anomaly.title}</h2>
      <p className="mt-1">{anomaly.explanation}</p>
      {anomaly.reaction && <p className="mt-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-950"><strong>Protection appliquée :</strong> {anomaly.reaction}</p>}
      {anomaly.related.length > 0 && (
        <p className="mt-2 text-sm"><span className="font-medium">Éléments liés :</span> {anomaly.related.map((item) => item.label).join(", ")}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Repérée le {when(anomaly.detectedAt)} · vue pour la dernière fois le {when(anomaly.lastSeenAt)} · {anomaly.occurrences} observation(s)
        {anomaly.handledBy ? ` · traitée par ${anomaly.handledBy} le ${when(anomaly.handledAt)}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {anomaly.status === "new" && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onChange("seen")}>Marquer comme vue</Button>}
        {anomaly.status !== "handled" && <Button type="button" size="sm" disabled={busy} onClick={() => onChange("handled")}>Marquer comme traitée</Button>}
        {anomaly.status === "handled" && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onChange("new")}>Rouvrir</Button>}
      </div>
    </li>
  )
}
