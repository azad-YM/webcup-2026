import { useState, type FormEvent } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { Link2, Sparkles, Unlink } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { Button, Label, Textarea } from "@boilerplate/shared-ui/components"
import {
  useChangeGroupStatusMutation,
  useFindSimilarRequestsQuery,
  useLinkRequestsMutation,
  useUnlinkRequestMutation,
} from "../../core/application/rtk-api/requests"
import {
  CATEGORY_LABELS,
  COMMENT_MAX,
  REQUEST_STATUSES,
  STATUS_LABELS,
  TRANSITION_LABELS,
  statusChangeError,
  type RequestStatus,
  type ServiceRequest,
  type SimilarRequest,
} from "../../core/domain/service-request"
import { PriorityBadge, RequestStatusBadge } from "./request-status-badge"

const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" })
const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"

/**
 * F75 : « demandes qui semblent parler du même problème ». L'origine est toujours affichée (IA ou repli local).
 * L'agent lie ou délie des demandes, puis traite tout le groupe en une action (journalisée par l'API).
 */
export function SimilarRequestsPanel({ request, canProcess }: { request: ServiceRequest; canProcess: boolean }) {
  const similar = useFindSimilarRequestsQuery(request.id)
  const [checked, setChecked] = useState<string[]>([])
  const [link, linkState] = useLinkRequestsMutation()
  const [unlink, unlinkState] = useUnlinkRequestMutation()
  const data = similar.currentData
  const failure = linkState.error ?? unlinkState.error

  const toggle = (id: string) => setChecked(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const submitLink = async (event: FormEvent) => {
    event.preventDefault()
    if (linkState.isLoading || checked.length === 0) return
    const result = await link({ requestId: request.id, otherIds: checked })
    if (!("error" in result)) setChecked([])
  }

  return (
    <section aria-labelledby="similar-title" className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="similar-title" className="text-sm font-semibold">Même problème ?</h3>
        {data && (
          <StatusBadge
            tone={data.source === "ai" ? "progress" : "neutral"}
            label={data.source === "ai" ? "Regroupement proposé par l’IA" : "Repli : similarité de texte"}
          />
        )}
      </div>
      {similar.isFetching && !data && <p role="status" className="text-sm text-muted-foreground">Recherche des demandes proches…</p>}
      {similar.error && !data ? (
        <div role="alert" className="space-y-2 text-sm text-red-800">
          <p>{getErrorMessage(similar.error)}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void similar.refetch()}>Réessayer</Button>
        </div>
      ) : null}
      {data && (
        <>
          {data.topic && (
            <p className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 shrink-0" aria-hidden="true" />
              <span><span className="font-medium">Sujet : </span>{data.topic}</span>
            </p>
          )}

          {data.groupId && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Liées à cette demande ({data.group.length + 1} au total)</h4>
              <ul className="space-y-2">
                {data.group.map(item => <li key={item.id}><SimilarCard item={item} /></li>)}
              </ul>
              {canProcess && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={unlinkState.isLoading} onClick={() => void unlink(request.id)}>
                    <Unlink aria-hidden="true" /> Retirer cette demande du groupe
                  </Button>
                </div>
              )}
              {canProcess && <GroupStatusForm key={data.groupId} groupId={data.groupId} />}
            </div>
          )}

          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune autre demande ouverte ne semble parler du même problème.</p>
          ) : (
            <form onSubmit={submitLink} className="space-y-2">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Demandes proches</legend>
                {data.items.map(item => (
                  <div key={item.id} className="flex items-start gap-2">
                    {canProcess && (
                      <input
                        id={`similar-${item.id}`}
                        type="checkbox"
                        className="mt-3 size-4"
                        checked={checked.includes(item.id)}
                        onChange={() => toggle(item.id)}
                        aria-label={`Lier la demande ${item.reference}`}
                      />
                    )}
                    <div className="min-w-0 flex-1"><SimilarCard item={item} /></div>
                  </div>
                ))}
              </fieldset>
              {canProcess && (
                <Button type="submit" size="sm" disabled={linkState.isLoading || checked.length === 0}>
                  <Link2 aria-hidden="true" /> {linkState.isLoading ? "Liaison…" : `Lier comme un même problème (${checked.length})`}
                </Button>
              )}
            </form>
          )}
        </>
      )}
      <div aria-live="polite">{failure ? <p role="alert" className="text-sm text-red-800">{getErrorMessage(failure)}</p> : null}</div>
    </section>
  )
}

function SimilarCard({ item }: { item: SimilarRequest }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-sm">
      <p className="text-xs text-slate-600">
        <span className="font-mono">{item.reference}</span> · {CATEGORY_LABELS[item.category]}{item.district ? ` · ${item.district}` : ""} · <time dateTime={item.createdAt}>{date.format(new Date(item.createdAt))}</time>
        {item.score !== null ? ` · ressemblance ${item.score} %` : ""}
      </p>
      <p className="mt-1 font-medium">{item.subject}</p>
      <div className="mt-2 flex flex-wrap gap-2"><RequestStatusBadge status={item.status} /><PriorityBadge priority={item.priority} /></div>
      {item.reasons.length > 0 && <p className="mt-1 text-xs text-slate-600">{item.reasons.join(" · ")}</p>}
    </div>
  )
}

function GroupStatusForm({ groupId }: { groupId: string }) {
  const [status, setStatus] = useState<RequestStatus>("in_progress")
  const [comment, setComment] = useState("")
  const [validation, setValidation] = useState<string | null>(null)
  const [change, { isLoading, error, data, reset }] = useChangeGroupStatusMutation()
  const failure = validation ?? (error ? getErrorMessage(error) : null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) return
    const invalid = statusChangeError(status, comment)
    setValidation(invalid)
    if (invalid) return
    reset()
    await change({ groupId, status, comment: comment.trim() || null })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
      <p className="text-sm font-medium">Traiter tout le groupe</p>
      <div className="space-y-1">
        <Label htmlFor="group-status">Nouvel état pour chaque demande liée</Label>
        <select id="group-status" className={selectClass} value={status} onChange={event => { setStatus(event.target.value as RequestStatus); setValidation(null) }}>
          {REQUEST_STATUSES.filter(option => option !== "submitted").map(option => <option key={option} value={option}>{TRANSITION_LABELS[option]} ({STATUS_LABELS[option]})</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="group-comment">{status === "rejected" ? "Motif du rejet (obligatoire)" : "Commentaire pour les habitants (facultatif)"}</Label>
        <Textarea id="group-comment" rows={2} maxLength={COMMENT_MAX} value={comment} onChange={event => { setComment(event.target.value); setValidation(null) }}
          aria-invalid={failure ? true : undefined} aria-describedby={failure ? "group-status-error" : undefined} />
      </div>
      <div aria-live="polite">
        {failure && <p id="group-status-error" role="alert" className="text-sm text-red-800">{failure}</p>}
        {data && !failure && (
          <p className="text-sm text-emerald-800">
            {data.changed.length} demande(s) mise(s) à jour{data.skipped.length > 0 ? ` ; ${data.skipped.length} ignorée(s) car cette étape n’est pas possible pour elles (${data.skipped.join(", ")})` : ""}.
          </p>
        )}
      </div>
      <Button type="submit" size="sm" disabled={isLoading} variant={status === "rejected" ? "destructive" : "default"}>{isLoading ? "Enregistrement…" : "Appliquer au groupe"}</Button>
    </form>
  )
}
