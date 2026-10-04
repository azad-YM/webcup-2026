import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import { PilotageError } from "../../../../application/errors/pilotage.error"
import type { DataExportGateway } from "../../../../application/ports/gateway/data-export.gateway"
import type { PilotageSessionProvider } from "../../../../application/ports/provider/pilotage-session.provider"
import type { ExportCatalog, ExportFile, ExportPreview, ExportRequest } from "../../../../domain/data-export"

export class DataExportHttpGateway extends ApiClient implements DataExportGateway {
  constructor(baseUrl: string, private readonly session: PilotageSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  async fetchCatalog(): Promise<ExportCatalog> {
    try {
      return await this.getAuth<ExportCatalog>("/pilotage/exports")
    } catch (error) {
      throw this.translate(error)
    }
  }

  async preview(request: ExportRequest): Promise<ExportPreview> {
    try {
      return await this.postAuth<ExportPreview>("/pilotage/exports", { ...request, preview: true })
    } catch (error) {
      throw this.translate(error)
    }
  }

  async exportFile(request: ExportRequest): Promise<ExportFile> {
    try {
      return await this.postAuth<ExportFile>("/pilotage/exports", { ...request, preview: false })
    } catch (error) {
      throw this.translate(error)
    }
  }

  private translate(error: unknown): PilotageError {
    if (error instanceof ApiHttpError) {
      if (error.status === 401) {
        this.session.invalidate()
        return new PilotageError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
      }
      if (error.status === 403) {
        return new PilotageError("forbidden", "Votre compte n’a pas accès aux exports (permission admin.export.read).")
      }
      if (error.status === 422) {
        const payload = error.payload as { message?: unknown; error?: unknown } | undefined
        const text = typeof payload?.error === "string" ? payload.error : typeof payload?.message === "string" ? payload.message : null
        return new PilotageError("invalid", text ?? "Export refusé : vérifiez les colonnes et la période.")
      }
    }
    return new PilotageError("unavailable", "Les exports sont indisponibles. Réessayez dans quelques instants.")
  }
}
