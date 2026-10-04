import type { ExportCatalog, ExportFile, ExportPreview, ExportRequest, ExportTemplate } from "../../../domain/data-export"

export interface DataExportGateway {
  fetchCatalog(): Promise<ExportCatalog>
  preview(request: ExportRequest): Promise<ExportPreview>
  /** Produit le fichier ; chaque export est journalisé côté serveur. */
  exportFile(request: ExportRequest): Promise<ExportFile>
}

/** Modèles d’export (sélections de colonnes) mémorisés dans ce navigateur. */
export interface ExportTemplateGateway {
  list(): Promise<ExportTemplate[]>
  save(templates: ExportTemplate[]): Promise<void>
}

/** Remet le fichier à la personne (téléchargement du navigateur). */
export interface FileDownloader {
  download(file: ExportFile): void
}
