import { useId, useState, type FormEvent } from "react"
import { Badge, Button, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useUpdateTrackingMutation } from "../../../core/application/rtk-api/pilotage"
import {
  isSafeLink,
  TRACKING_LABELS,
  trackingStatus,
  type TrackingLink,
  type TrackingStatus,
  type WebcupRequest,
} from "../../../core/domain/webcup-feed"

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })
const statusVariant: Record<TrackingStatus, "default" | "secondary" | "outline"> = { done: "default", in_progress: "secondary", todo: "outline" }

type Props = { request: WebcupRequest; canEdit: boolean }

/** Tracking of one request: status (editable at once), "Voir" links opened in a new tab, note, last change. */
export function TrackingCell({ request, canEdit }: Props) {
  const id = useId()
  const [update, mutation] = useUpdateTrackingMutation()
  const [editing, setEditing] = useState(false)
  const tracking = request.tracking
  const status = trackingStatus(request)
  const [draft, setDraft] = useState<{ note: string; links: TrackingLink[] }>({ note: "", links: [] })

  const save = (input: { status: TrackingStatus; note: string; links: TrackingLink[] }) =>
    update({ requestCode: request.requestCode, input }).unwrap()

  const startEditing = () => {
    setDraft({ note: tracking?.note ?? "", links: tracking?.links.length ? tracking.links : [{ label: "", url: "" }] })
    setEditing(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isLoading) return
    try {
      await save({ status, note: draft.note, links: draft.links })
      setEditing(false)
    } catch { /* the error is shown below */ }
  }

  const setLink = (index: number, patch: Partial<TrackingLink>) =>
    setDraft(current => ({ ...current, links: current.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) }))

  return (
    <div className="min-w-56 space-y-2">
      {canEdit ? (
        <div className="space-y-1">
          <Label htmlFor={`${id}-status`} className="sr-only">Statut du suivi de {request.requestCode}</Label>
          <select
            id={`${id}-status`}
            className={selectClass}
            value={status}
            disabled={mutation.isLoading}
            onChange={event => void save({ status: event.target.value as TrackingStatus, note: tracking?.note ?? "", links: tracking?.links ?? [] }).catch(() => undefined)}
          >
            {(Object.keys(TRACKING_LABELS) as TrackingStatus[]).map(value => <option key={value} value={value}>{TRACKING_LABELS[value]}</option>)}
          </select>
        </div>
      ) : (
        <Badge variant={statusVariant[status]}>{TRACKING_LABELS[status]}</Badge>
      )}

      {tracking && tracking.links.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-sm">
          {tracking.links.filter(link => isSafeLink(link.url)).map(link => (
            <li key={`${link.label}-${link.url}`}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                Voir : {link.label}<span className="sr-only"> (nouvel onglet)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {tracking?.note && !editing && <p className="text-sm whitespace-pre-line">{tracking.note}</p>}
      {tracking && (
        <p className="text-xs text-muted-foreground">
          Modifié le {dateFormat.format(new Date(tracking.updatedAt))} par {tracking.updatedBy}
        </p>
      )}

      {canEdit && !editing && (
        <Button type="button" variant="ghost" size="sm" onClick={startEditing}>Liens et note…</Button>
      )}

      {editing && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border bg-slate-50 p-3" aria-label={`Suivi de ${request.requestCode}`}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Liens vers les écrans qui répondent</legend>
            {draft.links.map((link, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <div>
                  <Label htmlFor={`${id}-label-${index}`} className="text-xs">Libellé</Label>
                  <Input id={`${id}-label-${index}`} value={link.label} maxLength={80} onChange={event => setLink(index, { label: event.target.value })} />
                </div>
                <div>
                  <Label htmlFor={`${id}-url-${index}`} className="text-xs">Adresse (http ou https)</Label>
                  <Input id={`${id}-url-${index}`} type="url" inputMode="url" value={link.url} maxLength={500} placeholder="https://…" onChange={event => setLink(index, { url: event.target.value })} />
                </div>
                <Button type="button" variant="ghost" className="self-end" onClick={() => setDraft(current => ({ ...current, links: current.links.filter((_, i) => i !== index) }))}>
                  Retirer<span className="sr-only"> le lien {index + 1}</span>
                </Button>
              </div>
            ))}
            {draft.links.length < 10 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setDraft(current => ({ ...current, links: [...current.links, { label: "", url: "" }] }))}>
                Ajouter un lien
              </Button>
            )}
          </fieldset>
          <div className="space-y-1">
            <Label htmlFor={`${id}-note`}>Note</Label>
            <Textarea id={`${id}-note`} value={draft.note} maxLength={500} rows={3} onChange={event => setDraft(current => ({ ...current, note: event.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={mutation.isLoading}>{mutation.isLoading ? "Enregistrement…" : "Enregistrer"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
          </div>
        </form>
      )}
      {mutation.isError && <p role="alert" className="text-sm text-red-700">{getErrorMessage(mutation.error)}</p>}
    </div>
  )
}
