import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { ExportCatalog, ExportPreview, ExportRequest, ExportTemplate } from "../../domain/data-export"
import { PilotageError } from "../errors/pilotage.error"
import { exportRequestIsValid } from "../../domain/data-export"

export const getExportCatalog: UseCase<void, ExportCatalog> = async (_dispatch, _getState, dependencies) =>
  dependencies.dataExportGateway.fetchCatalog()

export const previewExport: UseCase<ExportRequest, ExportPreview> = async (_dispatch, _getState, dependencies, request) => {
  if (!exportRequestIsValid(request)) throw new PilotageError("invalid", "Choisissez au moins une colonne et une période cohérente.")
  return dependencies.dataExportGateway.preview(request)
}

/** Produit le fichier puis le télécharge ; renvoie le nombre de lignes exportées. */
export const downloadExport: UseCase<ExportRequest, { rowCount: number; truncated: boolean }> = async (_dispatch, _getState, dependencies, request) => {
  if (!exportRequestIsValid(request)) throw new PilotageError("invalid", "Choisissez au moins une colonne et une période cohérente.")
  const file = await dependencies.dataExportGateway.exportFile(request)
  dependencies.fileDownloader.download(file)
  return { rowCount: file.rowCount, truncated: file.truncated }
}

export const getExportTemplates: UseCase<void, ExportTemplate[]> = async (_dispatch, _getState, dependencies) =>
  dependencies.exportTemplateGateway.list()

export const saveExportTemplate: UseCase<ExportTemplate, ExportTemplate[]> = async (_dispatch, _getState, dependencies, template) => {
  const name = template.name.trim().slice(0, 60)
  if (name === "" || template.columns.length === 0) throw new PilotageError("invalid", "Donnez un nom au modèle et cochez au moins une colonne.")
  const others = (await dependencies.exportTemplateGateway.list()).filter(item => !(item.name === name && item.dataset === template.dataset))
  const templates = [...others, { ...template, name }].slice(-20)
  await dependencies.exportTemplateGateway.save(templates)
  return templates
}

export const deleteExportTemplate: UseCase<{ name: string; dataset: string }, ExportTemplate[]> = async (_dispatch, _getState, dependencies, { name, dataset }) => {
  const templates = (await dependencies.exportTemplateGateway.list()).filter(item => !(item.name === name && item.dataset === dataset))
  await dependencies.exportTemplateGateway.save(templates)
  return templates
}
