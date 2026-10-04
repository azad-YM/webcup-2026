import type { ReactNode } from "react"
import { Button } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"

/** États communs des listes : chargement, erreur avec nouvelle tentative, vide. */
export function ListState({ isLoading, error, isEmpty, emptyLabel, onRetry, retrying, children }: {
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  emptyLabel: string
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
  if (isLoading) return <p role="status" className="text-sm text-muted-foreground">Chargement…</p>
  if (isEmpty) return <p role="status" className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  return <>{children}</>
}

export function FieldHelp({ id, children }: { id: string; children: ReactNode }) {
  return <p id={id} className="text-sm text-muted-foreground">{children}</p>
}

export const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
