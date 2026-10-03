import { AlertCircle, CheckCircle2, Info } from "@boilerplate/shared-ui/components/icon"
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"

type FieldFrameProps = {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  /** Identifiants supplémentaires (ex. message d’erreur global du formulaire). */
  extraDescribedBy?: string
  children: (aria: { "aria-describedby"?: string; "aria-invalid"?: true }) => ReactNode
}

/**
 * Cadre commun des champs : libellé relié, aide et erreur annoncées via
 * `aria-describedby`, état invalide exposé aux technologies d’assistance.
 */
function FieldFrame({ id, label, hint, error, optional, extraDescribedBy, children }: FieldFrameProps) {
  const hintId = hint ? `${id}-aide` : undefined
  const errorId = error ? `${id}-erreur` : undefined
  const describedBy = [hintId, errorId, extraDescribedBy].filter(Boolean).join(" ") || undefined
  return (
    <div>
      <label htmlFor={id} className="block font-medium text-slate-900">
        {label}
        {optional && <span className="font-normal text-slate-600"> (facultatif)</span>}
      </label>
      {hint && <p id={hintId} className="mt-1 text-sm text-slate-600">{hint}</p>}
      {children({ "aria-describedby": describedBy, ...(error ? { "aria-invalid": true as const } : {}) })}
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span><span className="sr-only">Erreur : </span>{error}</span>
        </p>
      )}
    </div>
  )
}

const controlClass = (error?: string) =>
  `mt-2 block w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-950 ${error ? "border-red-600" : "border-slate-400"}`

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "children"> & {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
}

export function TextField({ id, label, hint, error, optional, className, "aria-describedby": extraDescribedBy, ...input }: TextFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} optional={optional} extraDescribedBy={extraDescribedBy}>
      {(aria) => <input id={id} name={id} {...input} {...aria} className={`${controlClass(error)} ${className ?? ""}`} />}
    </FieldFrame>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "children"> & {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
}

export function TextAreaField({ id, label, hint, error, optional, className, ...textarea }: TextAreaFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} optional={optional}>
      {(aria) => <textarea id={id} name={id} {...textarea} {...aria} className={`${controlClass(error)} ${className ?? ""}`} />}
    </FieldFrame>
  )
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> & {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  options: readonly { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ id, label, hint, error, optional, options, placeholder, className, ...select }: SelectFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} optional={optional}>
      {(aria) => (
        <select id={id} name={id} {...select} {...aria} className={`${controlClass(error)} ${className ?? ""}`}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
    </FieldFrame>
  )
}

/**
 * Zone d’annonce d’un formulaire : toujours présente dans le DOM pour que les
 * lecteurs d’écran annoncent son contenu quand il change.
 */
export function FormAnnouncement({ tone, children, id }: { tone: "error" | "success" | "info"; children?: ReactNode; id?: string }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    info: "border-slate-200 bg-slate-50 text-slate-900"
  }[tone]
  return (
    <div aria-live={tone === "error" ? "assertive" : "polite"} aria-atomic="true">
      {children ? (
        <div id={id} className={`flex items-start gap-3 rounded-xl border p-4 ${styles}`}>
          {tone === "error" ? <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : tone === "success" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
          <div className="min-w-0 flex-1">{tone === "error" && <span className="sr-only">Erreur : </span>}{children}</div>
        </div>
      ) : null}
    </div>
  )
}
