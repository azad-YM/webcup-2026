"use client"
import { useEffect, useRef, type ReactNode } from "react"
import { CircleAlert } from "lucide-react"
import { cn } from "../../lib/utils"

export type FieldErrorItem = { fieldId: string; message: string }

/**
 * Résumé des erreurs d’un formulaire (F42) : reçoit le focus quand
 * `focusKey` change (ex. compteur de soumissions), annonce le nombre
 * d’erreurs et propose un lien vers chaque champ concerné.
 */
export function ErrorSummary({ errors, focusKey, title = "Le formulaire contient des erreurs", className }: {
  errors: FieldErrorItem[]
  focusKey?: number | string
  title?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const hasErrors = errors.length > 0
  useEffect(() => {
    if (hasErrors && focusKey !== undefined) ref.current?.focus()
  }, [focusKey, hasErrors])
  if (!hasErrors) return null
  return (
    <div ref={ref} tabIndex={-1} role="alert" className={cn("rounded-xl border-2 border-red-700 bg-red-50 p-4 text-red-950", className)}>
      <p className="flex items-center gap-2 font-semibold">
        <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
        {title} ({errors.length})
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              className="underline underline-offset-4"
              onClick={(event) => {
                event.preventDefault()
                document.getElementById(error.fieldId)?.focus()
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Message d’erreur relié à un champ (`id` à placer dans son `aria-describedby`). */
export function FieldErrorText({ id, children, className }: { id: string; children?: ReactNode; className?: string }) {
  if (!children) return null
  return (
    <p id={id} className={cn("flex items-start gap-1.5 text-sm font-medium text-red-800", className)}>
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span><span className="sr-only">Erreur : </span>{children}</span>
    </p>
  )
}

/**
 * Région d’annonce toujours présente dans le DOM (`aria-live`) : son contenu
 * est lu quand il change, sans déplacer le focus. Visible ou non.
 */
export function LiveAnnouncer({ children, assertive = false, visible = false, className }: {
  children?: ReactNode
  assertive?: boolean
  visible?: boolean
  className?: string
}) {
  return (
    <div aria-live={assertive ? "assertive" : "polite"} aria-atomic="true" className={cn(!visible && "sr-only", className)}>
      {children}
    </div>
  )
}

/** Chargement annoncé une seule fois aux lecteurs d’écran. */
export function LoadingStatus({ label, className }: { label: string; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <span aria-hidden="true" className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </p>
  )
}
