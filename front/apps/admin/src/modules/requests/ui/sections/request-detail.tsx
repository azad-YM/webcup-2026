import { useState, type FormEvent } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { MapPin } from "@boilerplate/shared-ui/components/icon"
import { Button, Label, Textarea } from "@boilerplate/shared-ui/components"
import { useChangeRequestStatusMutation } from "../../core/application/rtk-api/requests"
import {
  COMMENT_MAX,
  STATUS_LABELS,
  statusChangeError,
  TRANSITION_LABELS,
  TYPE_LABELS,
  type RequestStatus,
  type ServiceRequest,
} from "../../core/domain/service-request"
import { MaskedValue } from "@/modules/shared/ui/components/custom/sensitive-data"
import { RequestStatusBadge } from "./request-status-badge"

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" })

/** Detail of a request, its timeline and the processing form (F22). */
export function RequestDetail({ request, canProcess }: { request: ServiceRequest; canProcess: boolean }) {
  return (
    <article aria-labelledby="request-detail-title" className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <p className="font-mono text-sm text-muted-foreground">{request.reference} · {TYPE_LABELS[request.type]}</p>
        <h2 id="request-detail-title" className="mt-1 text-lg font-semibold">{request.subject}</h2>
        <div className="mt-2"><RequestStatusBadge status={request.status} /></div>
      </div>
      {(request.location || request.maskedFields?.includes("location")) && (
        <p className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><span className="font-medium">Lieu : </span><MaskedValue field="location" masked={request.maskedFields} value={request.location} /></span></p>
      )}
      {request.serviceId && <p className="text-sm"><span className="font-medium">Service : </span>{request.serviceId}</p>}
      <div>
        <h3 className="text-sm font-semibold">Message du citoyen</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm">{request.description}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold">Étapes</h3>
        <ol className="mt-2 space-y-3 border-l-2 border-slate-200 pl-4">
          {request.steps.map(step => (
            <li key={`${step.status}-${step.at}`} className="text-sm">
              <p><span className="font-medium">{STATUS_LABELS[step.status]}</span> · <time dateTime={step.at} className="text-muted-foreground">{dateTime.format(new Date(step.at))}</time></p>
              {step.comment && <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-2">{step.comment}</p>}
            </li>
          ))}
        </ol>
      </div>
      {request.allowedTransitions.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-muted-foreground">Demande close : aucune autre étape possible.</p>
      ) : canProcess ? (
        <ProcessForm key={`${request.id}-${request.status}`} request={request} />
      ) : (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-muted-foreground">Lecture seule : le traitement exige la permission admin.request.write.</p>
      )}
    </article>
  )
}

function ProcessForm({ request }: { request: ServiceRequest }) {
  const [status, setStatus] = useState<RequestStatus | null>(request.allowedTransitions[0] ?? null)
  const [comment, setComment] = useState("")
  const [validation, setValidation] = useState<string | null>(null)
  const [change, { isLoading, error, isSuccess, reset }] = useChangeRequestStatusMutation()
  const failure = validation ?? (error ? getErrorMessage(error) : null)
  const rejecting = status === "rejected"

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) return
    const invalid = statusChangeError(status, comment)
    setValidation(invalid)
    if (invalid || !status) return
    reset()
    await change({ requestId: request.id, status, expectedStatus: request.status, comment: comment.trim() || null })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 border-t pt-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Faire avancer la demande</legend>
        {request.allowedTransitions.map(option => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input type="radio" name="request-status" value={option} checked={status === option} onChange={() => { setStatus(option); setValidation(null) }} />
            {TRANSITION_LABELS[option]}
          </label>
        ))}
      </fieldset>
      <div className="space-y-1">
        <Label htmlFor="request-comment">{rejecting ? "Motif du rejet (obligatoire)" : "Commentaire pour le citoyen (facultatif)"}</Label>
        <Textarea
          id="request-comment"
          value={comment}
          maxLength={COMMENT_MAX}
          rows={3}
          required={rejecting}
          aria-invalid={failure ? true : undefined}
          aria-describedby={failure ? "request-comment-help request-comment-error" : "request-comment-help"}
          onChange={event => { setComment(event.target.value); setValidation(null) }}
        />
        <p id="request-comment-help" className="text-xs text-muted-foreground">Visible par le citoyen dans la chronologie de sa demande.</p>
      </div>
      <div aria-live="assertive" aria-atomic="true">
        {failure && <p id="request-comment-error" role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">{failure}</p>}
      </div>
      <div aria-live="polite">{isSuccess && !failure && <p className="text-sm text-emerald-800">Étape enregistrée.</p>}</div>
      <Button type="submit" disabled={isLoading} variant={rejecting ? "destructive" : "default"}>
        {isLoading ? "Enregistrement…" : status ? TRANSITION_LABELS[status] : "Enregistrer"}
      </Button>
    </form>
  )
}
