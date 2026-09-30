import { Eye, FileImage, FileText, Trash2 } from "@boilerplate/shared-ui/components/icon"

import { formatSize } from "./format-size"

type FileCardProps = {
  name: string
  size: number
  mimeType: string
  onPreview: () => void
  onRemove: () => void
  disabled?: boolean
}

export const FileCard = ({ name, size, mimeType, onPreview, onRemove, disabled }: FileCardProps) => {
  const Icon = mimeType.startsWith("image/") ? FileImage : FileText

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{name}</p>
        <p className="text-xs text-zinc-500">{formatSize(size)}</p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onPreview()
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
        aria-label={`Prévisualiser ${name}`}
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40"
        aria-label={`Supprimer ${name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
