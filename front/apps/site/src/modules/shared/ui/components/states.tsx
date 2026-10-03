import type { ReactNode } from "react"
import { AlertTriangle, Inbox, RotateCw } from "@boilerplate/shared-ui/components/icon"

/** Chargement : annoncé une fois, le squelette éventuel est masqué aux lecteurs d’écran. */
export function LoadingState({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children ? <div aria-hidden="true">{children}</div> : <p className="text-slate-700" aria-hidden="true">{label}</p>}
    </div>
  )
}

/** Erreur temporaire : message compréhensible et nouvelle tentative. */
export function ErrorState({ message, onRetry, retrying = false }: { message: string; onRetry?: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
      <p className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 font-medium text-red-900 hover:bg-red-100 disabled:opacity-60"
        >
          <RotateCw className="size-4" aria-hidden="true" /> {retrying ? "Nouvelle tentative…" : "Réessayer"}
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="mx-auto size-8 text-slate-500" aria-hidden="true" />
      <p className="mt-3 font-medium text-slate-900">{title}</p>
      {children && <div className="mt-2 text-slate-700">{children}</div>}
    </div>
  )
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, key) => (
        <div key={key} className="min-h-44 rounded-2xl border border-slate-200 bg-white p-6 motion-safe:animate-pulse">
          <div className="size-10 rounded-xl bg-slate-200" />
          <div className="mt-5 h-5 w-2/3 rounded bg-slate-200" />
          <div className="mt-4 h-4 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
