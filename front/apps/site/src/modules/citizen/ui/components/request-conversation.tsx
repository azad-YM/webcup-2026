"use client"
import { useState, type FormEvent } from "react"
import { Send } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { TextAreaField } from "@/modules/shared/ui/components/form-field"
import { ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { useListMyRequestMessagesQuery, usePostMyRequestMessageMutation } from "../../core/application/rtk-api/service-requests"
import { formatDateTime, MESSAGE_MAX } from "../../core/domain/service-request"

/** F84 : échanges avec la mairie sur une demande ; l'habitant peut répondre tant que la demande n'est pas close. */
export function RequestConversation({ reference }: { reference: string }) {
  const query = useListMyRequestMessagesQuery(reference)
  const [post, { isLoading, error, reset }] = usePostMyRequestMessageMutation()
  const [body, setBody] = useState("")
  const failure = toQueryError(query.error)
  const sendFailure = toQueryError(error)
  const items = query.data?.items ?? []

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) return
    reset()
    try {
      await post({ reference, body }).unwrap()
      setBody("")
    } catch {
      /* annoncé sous le champ */
    }
  }

  return (
    <section aria-labelledby="titre-echanges" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 id="titre-echanges" className="text-lg font-semibold">Échanges avec la mairie</h2>
      <div className="mt-4" aria-live="polite">
        {query.isLoading ? <LoadingState label="Chargement des messages…" />
          : failure && !query.data ? <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          : items.length === 0 ? <p className="text-slate-700">Aucun message pour l’instant. Un agent peut vous écrire ici ; vous serez notifié.</p>
          : (
            <ol className="space-y-3">
              {items.map((message) => (
                <li key={message.id} className={`rounded-xl p-4 ${message.author === "agent" ? "me-8 bg-teal-50" : "ms-8 bg-slate-100"}`}>
                  <p className="text-sm font-medium text-slate-700">
                    {message.author === "agent" ? "La mairie" : "Vous"} · <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-900">{message.body}</p>
                </li>
              ))}
            </ol>
          )}
      </div>
      {query.data?.canReply && (
        <form onSubmit={send} noValidate className="mt-5 space-y-3">
          <TextAreaField
            id="demande-reponse"
            label="Votre message à la mairie"
            rows={3}
            value={body}
            maxLength={MESSAGE_MAX}
            error={sendFailure && sendFailure.status !== 401 ? sendFailure.data : undefined}
            onChange={(event) => { setBody(event.target.value); reset() }}
          />
          <button type="submit" disabled={isLoading || !body.trim()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70">
            <Send className="size-5" aria-hidden="true" /> {isLoading ? "Envoi…" : "Envoyer"}
          </button>
        </form>
      )}
      {query.data && !query.data.canReply && <p className="mt-4 text-sm text-slate-600">Cette demande est close : pour un nouveau problème, envoyez une nouvelle demande.</p>}
    </section>
  )
}
