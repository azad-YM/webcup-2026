import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import { X } from "@boilerplate/shared-ui/components/icon"

type FilePreviewDialogProps = {
  file?: File | null
  source?: {
    url: string
    name: string
    mimeType: string
  } | null
  onClose: () => void
}

const useObjectUrl = (file: File | null) => {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)

    return () => {
      URL.revokeObjectURL(nextUrl)
    }
  }, [file])

  return url
}

const useBodyPortal = () => {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  return portalTarget
}

export const FilePreviewDialog = ({ file = null, source = null, onClose }: FilePreviewDialogProps) => {
  const objectUrl = useObjectUrl(file)
  const portalTarget = useBodyPortal()
  const url = objectUrl ?? source?.url ?? null
  const name = file?.name ?? source?.name ?? ""
  const mimeType = file?.type ?? source?.mimeType ?? ""
  const hasPreview = Boolean(file || source)

  const previewType = useMemo(() => {
    if (!hasPreview) return "unsupported"
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "pdf"
    return "unsupported"
  }, [hasPreview, mimeType, name])

  useEffect(() => {
    if (!hasPreview) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [hasPreview, onClose])

  if (!hasPreview || !url || !portalTarget) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Prévisualisation de ${name}`}
      className="fixed inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={(event) => {
        event.stopPropagation()
        if (event.currentTarget === event.target) onClose()
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <section
        className="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ height: "calc(100vh - 2rem)", maxHeight: "calc(100vh - 2rem)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-zinc-800">{name}</h2>
            <p className="text-xs text-zinc-500">Aperçu du document</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la prévisualisation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          className="bg-zinc-100"
          style={{ flex: "1 1 auto", minHeight: 0, overflow: "hidden" }}
        >
          {previewType === "image" ? (
            <img
              src={url}
              alt={name}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : null}

          {previewType === "pdf" ? (
            <object
              data={url}
              type="application/pdf"
              style={{ display: "block", width: "100%", height: "100%" }}
            >
              <iframe
                src={url}
                title={name}
                style={{ display: "block", width: "100%", height: "100%", border: 0 }}
              />
            </object>
          ) : null}

          {previewType === "unsupported" ? (
            <div
              className="flex items-center justify-center px-6 text-center"
              style={{ height: "100%" }}
            >
              <p className="text-sm text-zinc-500">
                Ce type de fichier ne peut pas être prévisualisé.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    portalTarget,
  )
}
