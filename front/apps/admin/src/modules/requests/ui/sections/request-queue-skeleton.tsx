import { Skeleton } from "@boilerplate/shared-ui/components"

export function RequestQueueSkeleton({ label = "Chargement des demandes…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        {[0, 1, 2].map(index => (
          <div key={index} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3 bg-slate-100" />
                <Skeleton className="h-5 w-3/4 bg-slate-100" />
              </div>
            </div>
            <Skeleton className="h-5 w-40 rounded-full bg-slate-100" />
            <Skeleton className="h-4 w-32 bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
