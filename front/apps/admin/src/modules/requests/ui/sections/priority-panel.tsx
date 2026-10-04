import { useState, type FormEvent } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { Button, Input, Label } from "@boilerplate/shared-ui/components"
import { useSetRequestPriorityMutation } from "../../core/application/rtk-api/requests"
import { PRIORITIES, PRIORITY_LABELS, PRIORITY_REASON_MAX, type RequestPriority, type ServiceRequest } from "../../core/domain/service-request"
import { PriorityBadge } from "./request-status-badge"

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"

/** F80 : priorité proposée par les règles, modifiable par l'agent (motif facultatif, journalisé). */
export function PriorityPanel({ request, canProcess }: { request: ServiceRequest; canProcess: boolean }) {
  const [priority, setPriority] = useState<RequestPriority>(request.priority)
  const [reason, setReason] = useState("")
  const [save, { isLoading, error, isSuccess, reset }] = useSetRequestPriorityMutation()
  const locked = request.medicalEmergency && !request.emergencyHandledAt

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading || priority === request.priority) return
    reset()
    await save({ requestId: request.id, priority, reason: reason.trim() || null })
  }

  return (
    <section aria-labelledby="priority-title" className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="priority-title" className="text-sm font-semibold">Priorité</h3>
        <PriorityBadge priority={request.priority} />
        <span className="text-xs text-muted-foreground">{request.prioritySource === "agent" ? "fixée par un agent" : "proposée automatiquement"}</span>
      </div>
      {request.priorityReason && <p className="text-sm text-slate-700">{request.priorityReason}</p>}
      {canProcess && (locked ? (
        <p className="text-sm text-muted-foreground">Une urgence médicale reste urgente tant qu’elle n’est pas prise en charge.</p>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="priority-select">Nouvelle priorité</Label>
            <select id="priority-select" className={selectClass} value={priority} onChange={event => { setPriority(event.target.value as RequestPriority); reset() }}>
              {PRIORITIES.map(option => <option key={option} value={option}>{PRIORITY_LABELS[option]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="priority-reason">Motif (facultatif)</Label>
            <Input id="priority-reason" value={reason} maxLength={PRIORITY_REASON_MAX} onChange={event => setReason(event.target.value)}
              aria-describedby={error ? "priority-error" : undefined} aria-invalid={error ? true : undefined} />
          </div>
          <Button type="submit" variant="outline" disabled={isLoading || priority === request.priority}>{isLoading ? "Enregistrement…" : "Changer"}</Button>
        </form>
      ))}
      <div aria-live="polite">
        {error ? <p id="priority-error" role="alert" className="text-sm text-red-800">{getErrorMessage(error)}</p> : null}
        {isSuccess && !error ? <p className="text-sm text-emerald-800">Priorité enregistrée.</p> : null}
      </div>
    </section>
  )
}
