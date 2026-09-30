import { useRef, useState, type DragEvent } from "react"

import { UploadCloud } from "@boilerplate/shared-ui/components/icon"
import { cn } from "@boilerplate/shared-ui/lib"

import { FileCard } from "./file-card"
import { FilePreviewDialog } from "./file-preview-dialog"
import { formatSize } from "./format-size"

const DEFAULT_ACCEPT = "image/*,application/pdf"
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

const keyOf = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

const isTypeAccepted = (file: File, accept: string): boolean => {
  const rules = accept
    .split(",")
    .map((rule) => rule.trim())
    .filter(Boolean)
  if (rules.length === 0) return true
  return rules.some((rule) => {
    if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1))
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule.toLowerCase())
    return file.type === rule
  })
}

type FileUploaderProps = {
  value: File[]
  onChange: (files: File[]) => void
  accept?: string
  maxSizeBytes?: number
  multiple?: boolean
  disabled?: boolean
  title?: string
  hint?: string
  className?: string
}

export const FileUploader = ({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  multiple = true,
  disabled = false,
  title = "Déposez vos documents ou cliquez pour parcourir",
  hint = "PDF ou images",
  className,
}: FileUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = (incoming: FileList | File[]) => {
    const existing = new Set(value.map(keyOf))
    const accepted: File[] = []
    const errors: string[] = []

    for (const file of Array.from(incoming)) {
      if (!isTypeAccepted(file, accept)) {
        errors.push(`${file.name} : type de fichier non pris en charge.`)
        continue
      }
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name} : dépasse ${formatSize(maxSizeBytes)}.`)
        continue
      }
      if (existing.has(keyOf(file))) continue
      existing.add(keyOf(file))
      accepted.push(file)
    }

    if (accepted.length > 0) {
      onChange(multiple ? [...value, ...accepted] : accepted.slice(-1))
    }
    setError(errors[0] ?? null)
  }

  const removeFile = (file: File) => {
    onChange(value.filter((current) => current !== file))
    setPreview((current) => (current === file ? null : current))
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center transition",
          disabled
            ? "cursor-not-allowed border-zinc-200 bg-zinc-50/50 opacity-60"
            : "cursor-pointer border-zinc-300 bg-zinc-50/70 hover:border-primary/50 hover:bg-zinc-50",
          isDragging && "border-primary bg-primary/5",
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200/70 text-zinc-500">
          <UploadCloud className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-zinc-700">{title}</p>
        <p className="text-xs text-zinc-500">
          {hint} · {formatSize(maxSizeBytes)} max
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files)
            event.target.value = ""
          }}
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((file) => (
            <FileCard
              key={keyOf(file)}
              name={file.name}
              size={file.size}
              mimeType={file.type}
              disabled={disabled}
              onPreview={() => setPreview(file)}
              onRemove={() => removeFile(file)}
            />
          ))}
        </div>
      ) : null}

      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
