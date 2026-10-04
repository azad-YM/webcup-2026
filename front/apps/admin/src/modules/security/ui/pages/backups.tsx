import { Button } from "@boilerplate/shared-ui/components"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useBackupsQuery } from "../../core/application/rtk-api/operations"
import { humanBytes, VERDICT_LABELS, type BackupReport, type BackupVerdict } from "../../core/domain/operations"

const VERDICT_TONES: Record<BackupVerdict, StatusTone> = { ok: "success", warning: "warning", failed: "danger" }
const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })

/** F87 : rapports de sauvegarde et de vérification (`admin.backup.read`, administrateur principal). */
export function BackupsPage() {
  const query = useBackupsQuery(undefined, { pollingInterval: 300_000 })
  const data = query.data
  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Sauvegardes</h1>
        <p className="mt-2 text-muted-foreground">
          Chaque nuit, les données importantes de la mairie (comptes, habitants, demandes, rendez-vous, publications, participation, journal) sont
          copiées dans un fichier compressé, avec une somme de contrôle. Puis la copie est <strong>vérifiée</strong> : relue entièrement et restaurée
          à l’essai dans des tables temporaires, sans toucher aux vraies données. Le verdict dit si l’on pourrait réellement tout récupérer.
        </p>
      </div>
      {query.isLoading && <div role="status" aria-label="Chargement des sauvegardes" className="h-32 animate-pulse rounded-xl bg-muted" />}
      {query.isError && <div role="alert"><p>{getErrorMessage(query.error)}</p><Button onClick={() => void query.refetch()} className="mt-3">Réessayer</Button></div>}
      {data && !query.isError && <>
        <div className="grid gap-3 md:grid-cols-2">
          <ReportCard title="Dernière sauvegarde" report={data.lastRun} empty="Aucune sauvegarde n’a encore été faite. Lancez « php bin/console app:backup:run --verify » ou attendez la tâche planifiée." />
          <ReportCard title="Dernière vérification" report={data.lastVerify} empty="Aucune vérification n’a encore été faite : une sauvegarde non vérifiée n’offre aucune garantie." />
        </div>
        <p className="text-sm text-muted-foreground">
          {data.storage.backups} sauvegarde(s) conservée(s) sur le serveur ({humanBytes(data.storage.bytes)}), rétention : {data.storage.retention} dernières.
          Les fichiers sont hors du dossier public et ne sont jamais envoyés au navigateur.
        </p>
        {data.lastVerify && data.lastVerify.tables.length > 0 && (
          <div className="nt-data-table overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="p-2 text-left font-semibold">Détail de la dernière vérification, table par table</caption>
              <thead className="bg-muted/50"><tr><th scope="col" className="p-3">Table</th><th scope="col" className="p-3">Domaine</th><th scope="col" className="p-3">Lignes</th><th scope="col" className="p-3">Taille</th><th scope="col" className="p-3">État</th><th scope="col" className="p-3">Contrôle</th></tr></thead>
              <tbody>{data.lastVerify.tables.map((table) => <tr key={table.name} className="border-t">
                <td className="p-3 font-mono">{table.name}</td>
                <td className="p-3">{table.bc}</td>
                <td className="p-3">{table.rows.toLocaleString("fr-FR")}</td>
                <td className="p-3">{humanBytes(table.bytes)}</td>
                <td className="p-3"><StatusBadge tone={table.status === "ok" ? "success" : table.status === "failed" ? "danger" : "warning"} label={table.status === "ok" ? "OK" : table.status === "failed" ? "Échec" : "À surveiller"} /></td>
                <td className="p-3">{table.notes}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
        <section aria-labelledby="historique-sauvegardes">
          <h2 id="historique-sauvegardes" className="text-lg font-semibold">Historique</h2>
          {data.reports.length === 0 ? <p className="mt-2">Aucun rapport.</p> : (
            <ul className="mt-2 space-y-2">{data.reports.map((report) => <li key={`${report.id}-${report.type}`} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
              <StatusBadge tone={VERDICT_TONES[report.verdict]} label={VERDICT_LABELS[report.verdict]} srPrefix="Verdict : " />
              <span className="font-medium">{report.type === "run" ? "Sauvegarde" : "Vérification"} du {when(report.startedAt)}</span>
              <span className="text-muted-foreground">{report.summary}</span>
            </li>)}</ul>
          )}
        </section>
      </>}
    </section>
  )
}

function ReportCard({ title, report, empty }: { title: string; report: BackupReport | null; empty: string }) {
  return (
    <section className="rounded-xl border bg-card p-4" aria-label={title}>
      <h2 className="font-semibold">{title}</h2>
      {!report ? <p className="mt-2 text-sm">{empty}</p> : <>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone={VERDICT_TONES[report.verdict]} label={VERDICT_LABELS[report.verdict]} srPrefix="Verdict : " size="md" />
          <span className="text-sm">{when(report.startedAt)} · {Math.max(1, Math.round(report.durationMs / 1000))} s</span>
        </div>
        <p className="mt-2">{report.summary}</p>
        <p className="mt-1 text-sm text-muted-foreground">{report.totals.tables} tables · {report.totals.rows.toLocaleString("fr-FR")} lignes · {humanBytes(report.totals.bytes)}{report.restoreMode === "reread_only" ? " · relecture seule (restauration d’essai impossible sur ce serveur)" : ""}</p>
        {report.issues.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">{report.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
      </>}
    </section>
  )
}
