import type { ReactNode } from "react"
import { Button, Skeleton } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"

export const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"

/** Squelette de chargement des listes (même modèle que la file des demandes). */
export function ParticipationSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
            <Skeleton className="h-3 w-1/3 bg-slate-100" />
            <Skeleton className="h-5 w-3/4 bg-slate-100" />
            <Skeleton className="h-5 w-32 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** États communs : chargement, erreur avec nouvelle tentative, vide. */
export function ListState({ isLoading, error, isEmpty, emptyLabel, loadingLabel, onRetry, retrying, children }: {
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  emptyLabel: string
  loadingLabel: string
  onRetry: () => void
  retrying: boolean
  children: ReactNode
}) {
  if (error) {
    return (
      <div role="alert" className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        <p>{getErrorMessage(error)}</p>
        <Button type="button" variant="outline" disabled={retrying} onClick={onRetry}>{retrying ? "Nouvelle tentative…" : "Réessayer"}</Button>
      </div>
    )
  }
  if (isLoading) return <ParticipationSkeleton label={loadingLabel} />
  if (isEmpty) return <p role="status" className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  return <>{children}</>
}

export function FormMessages({ error, success }: { error: unknown; success: string | null }) {
  return (
    <>
      {error !== undefined && error !== null && <p role="alert" className="text-sm text-destructive">{getErrorMessage(error)}</p>}
      <p role="status" className="text-sm text-green-700">{success ?? ""}</p>
    </>
  )
}
