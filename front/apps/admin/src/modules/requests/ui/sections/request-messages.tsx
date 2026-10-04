import { useState, type FormEvent } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { Send } from "@boilerplate/shared-ui/components/icon"
import { Button, Label, Textarea } from "@boilerplate/shared-ui/components"
import { useListRequestMessagesQuery, useReplyToRequestMutation } from "../../core/application/rtk-api/requests"
import { MESSAGE_MAX, REPLY_TEMPLATES, type ServiceRequest } from "../../core/domain/service-request"

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })
const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"

/** F84 : fil de messages avec l'habitant (visible par lui), distinct des commentaires d'étape. */
export function RequestMessages({ request, canProcess }: { request: ServiceRequest; canProcess: boolean }) {
  const messages = useListRequestMessagesQuery(request.id)
  const [body, setBody] = useState("")
  const [reply, { isLoading, error, reset }] = useReplyToRequestMutation()
  const items = messages.currentData ?? []

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) return
    reset()
    const result = await reply({ requestId: request.id, body })
    if (!("error" in result)) setBody("")
  }

  return (
    <section aria-labelledby="messages-title" className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h3 id="messages-title" className="text-sm font-semibold">Échanges avec l’habitant</h3>
      {messages.isLoading ? <p role="status" className="text-sm text-muted-foreground">Chargement des messages…</p>
        : messages.error && !messages.currentData ? (
          <div role="alert" className="space-y-2 text-sm text-red-800">
            <p>{getErrorMessage(messages.error)}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void messages.refetch()}>Réessayer</Button>
          </div>
        ) : items.length === 0 ? <p className="text-sm text-muted-foreground">Aucun message pour l’instant.</p> : (
          <ol className="space-y-2" aria-label="Messages, du plus ancien au plus récent">
            {items.map(message => (
              <li key={message.id} className={`rounded-lg p-3 text-sm ${message.author === "agent" ? "ml-6 bg-teal-50" : "mr-6 bg-slate-50"}`}>
                <p className="text-xs font-medium text-slate-600">
                  {message.author === "agent" ? "Mairie (réponse d’un agent)" : "Habitant"} · <time dateTime={message.createdAt}>{dateTime.format(new Date(message.createdAt))}</time>
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
              </li>
            ))}
          </ol>
        )}
      {canProcess && (
        <form onSubmit={submit} noValidate className="space-y-2 border-t pt-3">
          <div className="space-y-1">
            <Label htmlFor="reply-template">Réponse type (facultatif)</Label>
            <select id="reply-template" className={selectClass} value="" onChange={event => {
              const template = REPLY_TEMPLATES.find(item => item.label === event.target.value)
              if (template) setBody(template.body)
            }}>
              <option value="">Choisir une réponse type…</option>
              {REPLY_TEMPLATES.map(template => <option key={template.label} value={template.label}>{template.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="reply-body">Votre réponse</Label>
            <Textarea id="reply-body" rows={4} maxLength={MESSAGE_MAX} value={body} onChange={event => { setBody(event.target.value); reset() }}
              aria-describedby={error ? "reply-help reply-error" : "reply-help"} aria-invalid={error ? true : undefined} />
            <p id="reply-help" className="text-xs text-muted-foreground">Visible par l’habitant dans « Mes demandes », qui est notifié et peut vous répondre. Pour une note interne, n’utilisez pas ce champ.</p>
          </div>
          <div aria-live="assertive">{error ? <p id="reply-error" role="alert" className="text-sm text-red-800">{getErrorMessage(error)}</p> : null}</div>
          <Button type="submit" size="sm" disabled={isLoading || !body.trim()}><Send aria-hidden="true" /> {isLoading ? "Envoi…" : "Envoyer la réponse"}</Button>
        </form>
      )}
    </section>
  )
}
