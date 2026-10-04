import { useState } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { RefreshCw } from "@boilerplate/shared-ui/components/icon"
import { Button, Label, Textarea } from "@boilerplate/shared-ui/components"
import { DESK_POLLING_MS, useConcernQueueQuery, useHandleConcernMutation } from "../../core/application/rtk-api/agent-desk"
import { CONCERN_STATUS_LABELS, CONCERN_TOPIC_LABELS, type AgentConcern, type ConcernStatus } from "../../core/domain/agent-desk"
import { RequestQueueSkeleton } from "../sections/request-queue-skeleton"

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })

function ConcernCard({ concern, canProcess }: { concern: AgentConcern; canProcess: boolean }) {
  const [comment, setComment] = useState("")
  const [handle, state] = useHandleConcernMutation()
  const [missing, setMissing] = useState(false)
  const submit = async (status: "in_review" | "answered") => {
    if (state.isLoading) return
    if (status === "answered" && !comment.trim()) {
      setMissing(true)
      return
    }
    setMissing(false)
    const result = await handle({ concernId: concern.id, status, comment: comment.trim() || null })
    if (!("error" in result)) setComment("")
  }
  return (
    <article aria-labelledby={`concern-${concern.id}`} className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`concern-${concern.id}`} className="font-semibold">{concern.reference} · {concern.subject}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">{CONCERN_STATUS_LABELS[concern.status]}</span>
      </div>
      <p className="text-sm text-muted-foreground">{CONCERN_TOPIC_LABELS[concern.topic]} · reçue le {dateTime.format(new Date(concern.createdAt))}</p>
      <p className="whitespace-pre-wrap">{concern.message}</p>
      <ol className="space-y-1 border-l-2 pl-3 text-sm" aria-label="Trace de prise en compte">
        {concern.trail.map((step) => (
          <li key={`${step.status}-${step.at}`}>
            <span className="font-medium">{CONCERN_STATUS_LABELS[step.status]}</span> · {dateTime.format(new Date(step.at))}
            {step.comment && <p className="whitespace-pre-wrap text-muted-foreground">{step.comment}</p>}
          </li>
        ))}
      </ol>
      {canProcess && concern.status !== "answered" && (
        <div className="space-y-2">
          <Label htmlFor={`reponse-${concern.id}`}>Commentaire ou réponse (visible par l’habitant)</Label>
          <Textarea id={`reponse-${concern.id}`} maxLength={5000} value={comment} aria-invalid={missing || undefined} aria-describedby={missing ? `reponse-erreur-${concern.id}` : undefined} onChange={(event) => setComment(event.target.value)} />
          {missing && <p id={`reponse-erreur-${concern.id}`} role="alert" className="text-sm text-destructive">Rédigez la réponse avant de l’envoyer.</p>}
          {state.error ? <p role="alert" className="text-sm text-destructive">{getErrorMessage(state.error)}</p> : null}
          <div className="flex flex-wrap gap-2">
            {concern.status === "received" && (
              <Button type="button" variant="outline" disabled={state.isLoading} onClick={() => void submit("in_review")}>Marquer comme prise en compte</Button>
            )}
            <Button type="button" disabled={state.isLoading} onClick={() => void submit("answered")}>Envoyer la réponse</Button>
          </div>
        </div>
      )}
    </article>
  )
}

/** Inquiétudes des habitants (F51) : trace de prise en compte et réponse d'un agent. */
export function ConcernsPage() {
  const [status, setStatus] = useState<ConcernStatus | null>("received")
  const query = useConcernQueueQuery(status, { pollingInterval: DESK_POLLING_MS })
  const data = query.currentData
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
            Inquiétudes des habitants
            {data && <span className={`rounded-full px-3 py-1 text-sm font-medium ${data.receivedCount > 0 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{data.receivedCount} à prendre en compte</span>}
          </h1>
          <p className="mt-1 text-muted-foreground">Questions sur l’usage des données, les services ou la sécurité. L’habitant voit chaque étape et votre réponse.</p>
        </div>
        <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw className={query.isFetching ? "animate-spin" : undefined} /> Actualiser
        </Button>
      </div>
      <div className="w-56 space-y-1">
        <Label htmlFor="concern-status">État</Label>
        <select id="concern-status" className={selectClass} value={status ?? "all"} onChange={(event) => setStatus(event.target.value === "all" ? null : event.target.value as ConcernStatus)}>
          <option value="all">Tous les états</option>
          {(Object.keys(CONCERN_STATUS_LABELS) as ConcernStatus[]).map((option) => <option key={option} value={option}>{CONCERN_STATUS_LABELS[option]}</option>)}
        </select>
      </div>
      {query.isFetching && (!data || data.items.length === 0) ? (
        <RequestQueueSkeleton label="Chargement des inquiétudes…" />
      ) : query.error && !data ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-white p-4">
          <p>{getErrorMessage(query.error)}</p>
          <Button className="mt-3" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="rounded-xl border bg-white p-6 text-muted-foreground">Aucune inquiétude dans cet état.</p>
      ) : (
        <div className="space-y-4">
          {data?.items.map((concern) => <ConcernCard key={concern.id} concern={concern} canProcess={data.canProcess} />)}
        </div>
      )}
    </div>
  )
}
