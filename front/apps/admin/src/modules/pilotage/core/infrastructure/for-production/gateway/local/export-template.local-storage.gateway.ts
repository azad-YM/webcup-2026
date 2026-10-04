import type { ExportTemplateGateway, FileDownloader } from "../../../../application/ports/gateway/data-export.gateway"
import type { ExportFile, ExportTemplate } from "../../../../domain/data-export"

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">

export const EXPORT_TEMPLATES_STORAGE_KEY = "nova-terra.pilotage.export-templates"

/** Modèles d’export de ce navigateur ; une mémoire indisponible rend seulement la liste vide. */
export class ExportTemplateLocalStorageGateway implements ExportTemplateGateway {
  constructor(private readonly storage: Storage = globalThis.localStorage) {}

  async list(): Promise<ExportTemplate[]> {
    try {
      const value: unknown = JSON.parse(this.storage.getItem(EXPORT_TEMPLATES_STORAGE_KEY) ?? "[]")
      if (!Array.isArray(value)) return []
      return value.filter((item): item is ExportTemplate =>
        typeof item === "object" && item !== null && typeof item.name === "string" && typeof item.dataset === "string"
        && Array.isArray(item.columns) && item.columns.every((column: unknown) => typeof column === "string"))
    } catch {
      return []
    }
  }

  async save(templates: ExportTemplate[]): Promise<void> {
    try {
      this.storage.setItem(EXPORT_TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
    } catch {
      // Navigation privée ou mémoire pleine : les modèles ne sont pas conservés.
    }
  }
}

/** Téléchargement par un lien temporaire vers un Blob (aucune donnée ne passe par l’URL). */
export class BrowserFileDownloader implements FileDownloader {
  download(file: ExportFile): void {
    const url = URL.createObjectURL(new Blob([file.content], { type: file.mimeType }))
    const link = document.createElement("a")
    link.href = url
    link.download = file.fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
