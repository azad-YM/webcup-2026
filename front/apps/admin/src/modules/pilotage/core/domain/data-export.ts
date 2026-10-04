/** F88 : exports de données de suivi (contrat de `GET/POST /api/pilotage/exports`). */

export type ExportColumn = {
  key: string
  label: string
  /** Donnée personnelle : exportable seulement avec `admin.sensitive-data.read`. */
  sensitive: boolean
  /** Colonne sensible non autorisée pour ce compte : affichée masquée. */
  locked: boolean
  selected: boolean
}

export type ExportDataset = {
  key: string
  label: string
  description: string
  /** Date sur laquelle porte la période ; null quand la période ne s’applique pas. */
  periodLabel: string | null
  statuses: { value: string; label: string }[]
  columns: ExportColumn[]
}

export type ExportCatalog = {
  canExportSensitiveData: boolean
  datasets: ExportDataset[]
}

export type ExportFormat = "csv" | "json"

export type ExportRequest = {
  dataset: string
  from: string | null
  to: string | null
  status: string | null
  columns: string[]
  format: ExportFormat
}

export type ExportPreview = {
  columns: { key: string; label: string }[]
  rows: Record<string, string>[]
}

export type ExportFile = {
  fileName: string
  mimeType: string
  content: string
  rowCount: number
  truncated: boolean
}

/** Sélection de colonnes réutilisable, mémorisée dans ce navigateur. */
export type ExportTemplate = {
  name: string
  dataset: string
  columns: string[]
}

export const exportRequestIsValid = (request: ExportRequest): boolean =>
  request.dataset !== "" && request.columns.length > 0 && (request.from === null || request.to === null || request.from <= request.to)
