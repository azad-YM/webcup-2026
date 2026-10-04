import { useEffect, useId, useMemo, useState } from "react"
import { Download, Eye, Lock, Save, Trash2 } from "@boilerplate/shared-ui/components/icon"
import { Button } from "@boilerplate/shared-ui/components/shadcn/button"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import {
  useDeleteExportTemplateMutation,
  useDownloadExportMutation,
  useGetExportCatalogQuery,
  useGetExportTemplatesQuery,
  usePreviewExportMutation,
  useSaveExportTemplateMutation,
} from "../../core/application/rtk-api/pilotage"
import type { ExportDataset, ExportFormat, ExportPreview, ExportRequest } from "../../core/domain/data-export"

const fieldClass = "mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"

/** F88 : choisir un jeu de données, une période, des filtres et des colonnes ; aperçu puis fichier CSV ou JSON. */
export function DataExportsPage() {
  const catalog = useGetExportCatalogQuery()
  const templates = useGetExportTemplatesQuery()
  const [previewExport, previewState] = usePreviewExportMutation()
  const [downloadExport, downloadState] = useDownloadExportMutation()
  const [saveTemplate] = useSaveExportTemplateMutation()
  const [deleteTemplate] = useDeleteExportTemplateMutation()
  const ids = useId()

  const [datasetKey, setDatasetKey] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [status, setStatus] = useState("")
  const [columns, setColumns] = useState<string[]>([])
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)

  const datasets = catalog.data?.datasets ?? []
  const dataset: ExportDataset | undefined = datasets.find(item => item.key === datasetKey) ?? datasets[0]

  useEffect(() => {
    if (!dataset) return
    setDatasetKey(dataset.key)
    setColumns(dataset.columns.filter(column => column.selected && !column.locked).map(column => column.key))
    setStatus("")
    setPreview(null)
    // Reset only when the chosen dataset changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.key])

  const request: ExportRequest | null = useMemo(() => dataset ? {
    dataset: dataset.key,
    from: dataset.periodLabel && from ? from : null,
    to: dataset.periodLabel && to ? to : null,
    status: status || null,
    columns: dataset.columns.map(column => column.key).filter(key => columns.includes(key)),
    format,
  } : null, [dataset, from, to, status, columns, format])

  const periodError = request?.from && request.to && request.from > request.to ? "La date de fin doit suivre la date de début." : null
  const columnsError = request && request.columns.length === 0 ? "Cochez au moins une colonne." : null
  const blocked = !request || periodError !== null || columnsError !== null
  const datasetTemplates = (templates.data ?? []).filter(item => item.dataset === dataset?.key)

  const toggle = (key: string) => {
    setPreview(null)
    setColumns(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key])
  }

  const runPreview = async () => {
    if (!request || blocked) return
    setMessage(null)
    try {
      setPreview(await previewExport(request).unwrap())
    } catch (error) {
      setMessage({ tone: "error", text: getErrorMessage(error) })
    }
  }

  const runDownload = async () => {
    if (!request || blocked) return
    setMessage(null)
    try {
      const result = await downloadExport(request).unwrap()
      setMessage({ tone: "ok", text: `Fichier téléchargé : ${result.rowCount} ligne(s).${result.truncated ? " L’export est limité à 10 000 lignes : réduisez la période pour tout obtenir." : ""} Cet export est inscrit au journal des actions.` })
    } catch (error) {
      setMessage({ tone: "error", text: getErrorMessage(error) })
    }
  }

  const applyTemplate = (name: string) => {
    const template = datasetTemplates.find(item => item.name === name)
    if (!template || !dataset) return
    const allowed = dataset.columns.filter(column => !column.locked).map(column => column.key)
    setColumns(template.columns.filter(key => allowed.includes(key)))
    setTemplateName(template.name)
    setPreview(null)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Exports de données</h1>
        <p className="mt-1 text-muted-foreground">Choisissez des données de suivi et téléchargez-les dans un format simple à réutiliser (tableur ou JSON). Chaque export est inscrit au journal des actions.</p>
      </div>

      {catalog.isLoading && <p role="status">Chargement des données exportables…</p>}
      {catalog.isError && (
        <div role="alert" className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{getErrorMessage(catalog.error)}</p>
          <Button type="button" variant="outline" onClick={() => void catalog.refetch()}>Réessayer</Button>
        </div>
      )}

      {dataset && request && (
        <form className="space-y-6" onSubmit={event => { event.preventDefault(); void runDownload() }}>
          <section aria-labelledby={`${ids}-what`} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
            <h2 id={`${ids}-what`} className="text-lg font-semibold">1. Les données</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Jeu de données
                <select className={fieldClass} value={dataset.key} onChange={event => setDatasetKey(event.target.value)}>
                  {datasets.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>
              {dataset.statuses.length > 0 && (
                <label className="block text-sm font-medium">Statut
                  <select className={fieldClass} value={status} onChange={event => { setStatus(event.target.value); setPreview(null) }}>
                    <option value="">Tous les statuts</option>
                    {dataset.statuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{dataset.description}</p>
            {dataset.periodLabel ? (
              <fieldset className="grid gap-4 md:grid-cols-2">
                <legend className="mb-2 text-sm font-medium">Période ({dataset.periodLabel.toLowerCase()}) — laissez vide pour tout exporter</legend>
                <label className="block text-sm">Du
                  <input type="date" className={fieldClass} value={from} onChange={event => { setFrom(event.target.value); setPreview(null) }} />
                </label>
                <label className="block text-sm">Au
                  <input type="date" className={fieldClass} value={to} aria-invalid={periodError !== null} aria-describedby={periodError ? `${ids}-period` : undefined} onChange={event => { setTo(event.target.value); setPreview(null) }} />
                </label>
                {periodError && <p id={`${ids}-period`} className="text-sm text-red-700">{periodError}</p>}
              </fieldset>
            ) : <p className="text-sm text-muted-foreground">Ce jeu de données est un instantané : la période ne s’applique pas.</p>}
          </section>

          <section aria-labelledby={`${ids}-columns`} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
            <h2 id={`${ids}-columns`} className="text-lg font-semibold">2. Les colonnes</h2>
            <fieldset aria-describedby={columnsError ? `${ids}-columns-error` : undefined}>
              <legend className="sr-only">Colonnes à inclure</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {dataset.columns.map(column => (
                  <label key={column.key} className={`flex items-center gap-2 text-sm ${column.locked ? "text-muted-foreground" : ""}`}>
                    <input type="checkbox" className="size-4" disabled={column.locked} checked={columns.includes(column.key)} onChange={() => toggle(column.key)} />
                    {column.label}
                    {column.sensitive && <span className="inline-flex items-center gap-1 text-xs text-amber-800">{column.locked && <Lock aria-hidden className="size-3" />}{column.locked ? "masquée (données personnelles)" : "donnée personnelle"}</span>}
                  </label>
                ))}
              </div>
              {columnsError && <p id={`${ids}-columns-error`} className="mt-2 text-sm text-red-700">{columnsError}</p>}
            </fieldset>
            {!catalog.data?.canExportSensitiveData && <p className="text-sm text-muted-foreground">Les colonnes de données personnelles demandent la permission « données sensibles » (admin.sensitive-data.read).</p>}

            <div className="flex flex-wrap items-end gap-3 border-t pt-4">
              {datasetTemplates.length > 0 && (
                <label className="block text-sm font-medium">Modèle enregistré
                  <select className={fieldClass} defaultValue="" onChange={event => applyTemplate(event.target.value)}>
                    <option value="" disabled>Choisir un modèle…</option>
                    {datasetTemplates.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                </label>
              )}
              <label className="block text-sm font-medium">Nom du modèle
                <input className={fieldClass} value={templateName} maxLength={60} onChange={event => setTemplateName(event.target.value)} placeholder="Ex. Suivi hebdomadaire" />
              </label>
              <Button type="button" variant="outline" disabled={templateName.trim() === "" || columns.length === 0} onClick={() => void saveTemplate({ name: templateName, dataset: dataset.key, columns: request.columns }).unwrap().then(() => setMessage({ tone: "ok", text: `Modèle « ${templateName.trim()} » enregistré dans ce navigateur.` }), error => setMessage({ tone: "error", text: getErrorMessage(error) }))}>
                <Save aria-hidden /> Enregistrer la sélection
              </Button>
              {datasetTemplates.some(item => item.name === templateName.trim()) && (
                <Button type="button" variant="ghost" onClick={() => void deleteTemplate({ name: templateName.trim(), dataset: dataset.key }).unwrap().then(() => setTemplateName(""))}>
                  <Trash2 aria-hidden /> Supprimer ce modèle
                </Button>
              )}
            </div>
          </section>

          <section aria-labelledby={`${ids}-file`} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
            <h2 id={`${ids}-file`} className="text-lg font-semibold">3. Aperçu et fichier</h2>
            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className="mb-2 font-medium">Format</legend>
              <label className="flex items-center gap-2"><input type="radio" name={`${ids}-format`} checked={format === "csv"} onChange={() => setFormat("csv")} /> CSV (tableur : Excel, LibreOffice)</label>
              <label className="flex items-center gap-2"><input type="radio" name={`${ids}-format`} checked={format === "json"} onChange={() => setFormat("json")} /> JSON (outils et programmes)</label>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={blocked || previewState.isLoading} onClick={() => void runPreview()}>
                <Eye aria-hidden /> {previewState.isLoading ? "Aperçu en cours…" : "Voir un aperçu"}
              </Button>
              <Button type="submit" disabled={blocked || downloadState.isLoading}>
                <Download aria-hidden /> {downloadState.isLoading ? "Préparation du fichier…" : `Télécharger (${format.toUpperCase()})`}
              </Button>
            </div>
            {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-red-700" : "text-sm text-emerald-800"}>{message.text}</p>}

            {preview && (
              preview.rows.length === 0
                ? <p role="status" className="text-sm text-muted-foreground">Aucune ligne ne correspond à ces critères.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <caption className="mb-2 text-left text-sm text-muted-foreground">Aperçu des {preview.rows.length} premières lignes</caption>
                      <thead><tr>{preview.columns.map(column => <th key={column.key} scope="col" className="border-b px-2 py-1 font-medium">{column.label}</th>)}</tr></thead>
                      <tbody>
                        {preview.rows.map((row, index) => (
                          <tr key={index} className="odd:bg-slate-50">
                            {preview.columns.map(column => <td key={column.key} className="max-w-xs truncate px-2 py-1" title={row[column.key]}>{row[column.key]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            )}
          </section>
        </form>
      )}
    </div>
  )
}
