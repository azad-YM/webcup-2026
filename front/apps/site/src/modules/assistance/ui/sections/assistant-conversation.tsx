"use client"
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { format } from "@/modules/shared/core/i18n/locales"
import { useLocale, useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { useOrientMutation } from "../../core/application/rtk-api/assistance"
import {
  MAX_MESSAGE_LENGTH,
  MAX_USER_TURNS,
  userTurns,
  type OrientationAction,
  type OrientationMessage,
  type OrientationReply
} from "../../core/domain/orientation"
import { ASSISTANT_MESSAGES } from "../i18n/assistant-messages"

type Turn = OrientationMessage & { reply?: OrientationReply }

const linkClass = "font-medium text-teal-800 underline underline-offset-4"

function ActionLink({ action }: { action: OrientationAction }) {
  const t = useMessages(ASSISTANT_MESSAGES)
  const label = format((t as Record<string, string>)[`action_${action.type}`] ?? action.href, { name: action.serviceName ?? "", number: action.number ?? "" })
  const className = action.type === "call"
    ? "inline-flex rounded-xl bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800"
    : "inline-flex rounded-xl border border-teal-700 bg-white px-4 py-2 font-medium text-teal-900 hover:bg-teal-50"
  if (action.href.startsWith("tel:")) return <a href={action.href} className={className}><span dir="ltr">{label}</span></a>
  return <Link href={action.href as Route} className={className}>{label}</Link>
}

/**
 * F91, F92 : conversation courte avec l’assistant d’orientation. Journal accessible (`role="log"`), clavier
 * (Entrée envoie, Maj+Entrée va à la ligne), réponses rapides et 1 à 3 actions concrètes ; sortie toujours visible
 * vers la mairie, les urgences et l’accueil des nouveaux arrivants. Rien n’est conservé après la fermeture.
 */
export default function AssistantConversation({ initialText = "", compact = false }: { initialText?: string; compact?: boolean }) {
  const t = useMessages(ASSISTANT_MESSAGES)
  const { locale, dir } = useLocale()
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState(initialText.slice(0, MAX_MESSAGE_LENGTH))
  const [error, setError] = useState<string | null>(null)
  const [orient, { isLoading }] = useOrientMutation()
  const input = useRef<HTMLTextAreaElement>(null)
  const id = useId()
  const finished = userTurns(turns) >= MAX_USER_TURNS
  useEffect(() => input.current?.focus(), [])

  const send = async (raw: string) => {
    const message = raw.trim()
    if (isLoading || finished) return
    if (!message) return setError(t.empty)
    if (message.length > MAX_MESSAGE_LENGTH) return setError(t.tooLong)
    setError(null)
    const history: Turn[] = [...turns, { role: "user", text: message }]
    setTurns(history)
    setText("")
    const result = await orient({ locale, messages: history.map(({ role, text: content }) => ({ role, text: content })) })
    if ("data" in result && result.data) {
      const reply = result.data
      const answer = [reply.reply, reply.question].filter(Boolean).join(" ")
      setTurns([...history, { role: "assistant", text: answer, reply }])
    } else {
      setError(toQueryError(result.error)?.data ?? "L’assistant ne répond pas pour le moment.")
      setTurns(turns)
      setText(message)
    }
    input.current?.focus()
  }
  const onSubmit = (event: FormEvent) => { event.preventDefault(); void send(text) }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(text) }
  }
  const last = [...turns].reverse().find((turn) => turn.reply)?.reply

  return (
    <div className="flex flex-col gap-4" dir={dir}>
      <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-800">{t.disclaimer}</p>
      <div role="log" aria-live="polite" aria-relevant="additions" aria-label={t.title} className={`space-y-3 overflow-y-auto ${compact ? "max-h-[45dvh]" : "max-h-[60dvh]"}`}>
        <p className="me-8 rounded-2xl bg-teal-50 p-3 text-slate-900"><span className="sr-only">{t.assistant} </span>{t.welcome}</p>
        {turns.map((turn, index) => (
          <div key={index} className={turn.role === "user" ? "ms-8 rounded-2xl bg-slate-900 p-3 text-white" : `me-8 rounded-2xl p-3 text-slate-900 ${turn.reply?.urgent ? "border-2 border-red-700 bg-red-50" : "bg-teal-50"}`}>
            <p className="whitespace-pre-line">
              <span className="sr-only">{turn.role === "user" ? t.you : t.assistant} </span>
              {turn.reply?.urgent && <strong className="me-2 rounded bg-red-700 px-2 py-0.5 text-sm text-white">{t.urgent}</strong>}
              {turn.text}
            </p>
            {turn.reply && turn.reply.actions.length > 0 && (
              <div className="mt-3">
                <p className="sr-only">{t.actionsTitle}</p>
                <ul className="flex flex-wrap gap-2">
                  {turn.reply.actions.map((action) => <li key={`${action.type}-${action.href}`}><ActionLink action={action} /></li>)}
                </ul>
              </div>
            )}
            {turn.reply && <p className="mt-2 text-xs text-slate-600">{turn.reply.source === "model" ? t.sourceModel : t.sourceLocal}</p>}
          </div>
        ))}
      </div>
      {isLoading && <p role="status" className="text-sm text-slate-700">{t.sending}</p>}
      {last && last.suggestions.length > 0 && !finished && !isLoading && (
        <div role="group" aria-label={t.quickReplies} className="flex flex-wrap gap-2">
          {last.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-medium hover:bg-slate-50">{suggestion}</button>
          ))}
        </div>
      )}
      {finished ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-slate-900">{t.limit}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2">
          <label htmlFor={`${id}-message`} className="block font-medium">{t.inputLabel}</label>
          <textarea
            ref={input}
            id={`${id}-message`}
            rows={compact ? 2 : 3}
            maxLength={MAX_MESSAGE_LENGTH}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            aria-describedby={`${id}-aide${error ? ` ${id}-erreur` : ""}`}
            aria-invalid={error ? true : undefined}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base focus:border-teal-700"
          />
          <p id={`${id}-aide`} className="text-sm text-slate-600">{t.inputHint}</p>
          {error && <p id={`${id}-erreur`} role="alert" className="text-sm font-medium text-red-800">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isLoading} className="rounded-xl bg-teal-700 px-5 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60">{t.send}</button>
            {turns.length > 0 && <button type="button" onClick={() => { setTurns([]); setError(null); input.current?.focus() }} className="rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">{t.restart}</button>}
          </div>
        </form>
      )}
      {finished && <button type="button" onClick={() => setTurns([])} className="self-start rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">{t.restart}</button>}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="text-slate-700">{t.otherWays}</span>
        <Link href={"/espace/demandes/nouvelle" as Route} className={linkClass}>{t.contactCityHall}</Link>
        <Link href="/urgences" className={linkClass}>{t.emergencies}</Link>
        <Link href="/bienvenue" className={linkClass}>{t.newcomers}</Link>
      </p>
    </div>
  )
}
