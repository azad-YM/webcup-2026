"use client"
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { CheckCircle2, HandHeart, MapPin, MessageCircleWarning, ShieldCheck } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { EmptyState, ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { FormAnnouncement, SelectField, TextAreaField, TextField } from "@/modules/shared/ui/components/form-field"
import { FormProtection, useProtectedSubmit } from "@boilerplate/shared-ui/components/a11y"
import { siteEnv } from "@/config/env"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { StatusBadge } from "../components/request-status"
import {
  PARTICIPATION_POLLING_MS,
  useListConcernsQuery,
  useListPublicRequestsQuery,
  useRaiseConcernMutation,
  useSupportMutation
} from "../../core/application/rtk-api/participation"
import {
  CONCERN_LIMITS,
  CONCERN_STATUS_LABELS,
  CONCERN_TOPIC_LABELS,
  validateConcern,
  type Concern,
  type ConcernDraft,
  type ConcernTopic,
  type PublicRequest
} from "../../core/domain/participation"
import { formatDateTime } from "../../core/domain/service-request"

const TOPIC_OPTIONS = (Object.keys(CONCERN_TOPIC_LABELS) as ConcernTopic[]).map((value) => ({ value, label: CONCERN_TOPIC_LABELS[value] }))

function useLogoutOnUnauthorized(error: unknown) {
  const { logout } = useSession()
  const unauthorized = toQueryError(error)?.status === 401
  useEffect(() => { if (unauthorized) logout() }, [unauthorized, logout])
}

/** F52 : soutenir un signalement public d'un autre habitant (un soutien par citoyen). */
function PublicRequestCard({ request }: { request: PublicRequest }) {
  const [support, state] = useSupportMutation()
  const error = toQueryError(state.error)
  const count = request.supportCount
  return (
    <article aria-labelledby={`titre-public-${request.id}`} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-600">{request.reference} · déposé le <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time></p>
      <h3 id={`titre-public-${request.id}`} className="mt-1 text-lg font-semibold text-slate-950">{request.subject}</h3>
      {request.location && <p className="mt-2 flex items-start gap-2 text-slate-800"><MapPin className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />{request.location}</p>}
      <div className="mt-3"><StatusBadge status={request.status} /></div>
      <p className="mt-3 font-medium text-slate-900" aria-live="polite">{count} habitant{count > 1 ? "s" : ""} soutien{count > 1 ? "nent" : "t"} cette demande</p>
      <div className="mt-auto pt-4">
        {request.mine ? (
          <p className="text-sm text-slate-700">C’est votre signalement.</p>
        ) : request.supportedByMe ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 font-medium text-emerald-800"><CheckCircle2 className="size-5" aria-hidden="true" /> Vous soutenez cette demande</p>
            <button type="button" disabled={state.isLoading} onClick={() => void support({ requestId: request.id, support: false })} className="text-sm font-medium text-slate-700 underline underline-offset-4 disabled:opacity-60">
              Retirer mon soutien<span className="sr-only"> à {request.reference}</span>
            </button>
          </div>
        ) : (
          <button type="button" disabled={state.isLoading} onClick={() => void support({ requestId: request.id, support: true })} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
            <HandHeart className="size-5" aria-hidden="true" /> {state.isLoading ? "Enregistrement…" : "Je soutiens"}<span className="sr-only"> la demande {request.reference}</span>
          </button>
        )}
        {error && error.status !== 401 && <p role="alert" className="mt-2 text-sm text-red-800">{error.data}</p>}
      </div>
    </article>
  )
}

function PublicRequests() {
  const query = useListPublicRequestsQuery(undefined, { pollingInterval: PARTICIPATION_POLLING_MS })
  useLogoutOnUnauthorized(query.error)
  const failure = toQueryError(query.error)
  const items = query.data ?? []
  return (
    <section aria-labelledby="titre-soutenir">
      <h2 id="titre-soutenir" className="text-2xl font-semibold tracking-tight">Soutenir une demande d’habitants</h2>
      <p className="mt-1 text-slate-700">Signalements que leurs auteurs ont choisi de rendre visibles, sans nom ni message. Votre soutien aide la mairie à mesurer leur importance.</p>
      <div className="mt-5">
        {query.isLoading ? (
          <LoadingState label="Chargement des demandes des habitants…" />
        ) : failure && !query.data ? (
          failure.status === 401 ? null : <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <EmptyState title="Aucune demande publique en cours.">Lorsque vous signalez un problème, vous pouvez choisir de le rendre visible pour que d’autres habitants le soutiennent.</EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((item) => <li key={item.id}><PublicRequestCard request={item} /></li>)}
          </ul>
        )}
      </div>
    </section>
  )
}

/** F51 : formulaire avec accusé de réception immédiat (référence, date). */
function ConcernForm() {
  const [draft, setDraft] = useState<ConcernDraft>({ topic: "data", subject: "", message: "" })
  const [errors, setErrors] = useState<Partial<Record<"subject" | "message", string>>>({})
  const [sent, setSent] = useState<Concern | null>(null)
  const [raise, { isLoading, error }] = useRaiseConcernMutation()
  // L25 (F81, F82) : protection contre les robots et les envois multiples.
  const guard = useProtectedSubmit({ apiBaseUrl: siteEnv.apiBaseUrl, form: "inquietude" })
  const sending = useRef(false)
  const receipt = useRef<HTMLHeadingElement>(null)
  const failure = toQueryError(error)
  useEffect(() => { if (sent) receipt.current?.focus() }, [sent])

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (sending.current) return
    const found = validateConcern(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    sending.current = true
    try {
      const concern = await guard.submit(draft, () => raise(draft).unwrap())
      if (concern === undefined) return
      setSent(concern)
      setDraft({ topic: "data", subject: "", message: "" })
    } catch {
      /* Message affiché par FormAnnouncement. */
    } finally {
      sending.current = false
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 ref={receipt} tabIndex={-1} className="flex items-center gap-2 text-xl font-semibold text-emerald-950 focus:outline-none">
          <CheckCircle2 className="size-6" aria-hidden="true" /> Accusé de réception : {sent.reference}
        </h3>
        <p className="mt-2 text-slate-800">
          Votre inquiétude « {sent.subject} » a été reçue le <time dateTime={sent.createdAt}>{formatDateTime(sent.createdAt)}</time>. Un agent va la prendre en compte ;
          vous suivrez chaque étape ci-dessous et serez prévenu dans « Mes notifications ».
        </p>
        <button type="button" onClick={() => setSent(null)} className="mt-4 font-medium text-teal-800 underline underline-offset-4">Faire remonter une autre inquiétude</button>
      </div>
    )
  }
  return (
    <form onSubmit={(event) => void send(event)} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <SelectField id="inquietude-sujet" label="Thème" options={TOPIC_OPTIONS} value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value as ConcernTopic })} />
      <TextField id="inquietude-objet" label="Objet" value={draft.subject} maxLength={CONCERN_LIMITS.subject} required error={errors.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} />
      <TextAreaField id="inquietude-message" label="Votre message" rows={6} value={draft.message} maxLength={CONCERN_LIMITS.message} required error={errors.message} hint="N’indiquez pas d’information médicale ni de mot de passe." onChange={(event) => setDraft({ ...draft, message: event.target.value })} />
      <FormProtection guard={guard} duplicateMessage="Votre inquiétude a déjà été envoyée : elle n’a pas été enregistrée une seconde fois." />
      <FormAnnouncement tone="error">{guard.refusal ?? (failure && failure.status !== 401 ? failure.data : null)}</FormAnnouncement>
      <button type="submit" disabled={isLoading || guard.submitting} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-70">
        <MessageCircleWarning className="size-5" aria-hidden="true" /> {isLoading ? "Envoi en cours…" : "Envoyer mon inquiétude"}
      </button>
    </form>
  )
}

function MyConcerns() {
  const query = useListConcernsQuery(undefined, { pollingInterval: PARTICIPATION_POLLING_MS })
  useLogoutOnUnauthorized(query.error)
  const failure = toQueryError(query.error)
  const items = query.data ?? []
  return (
    <section aria-labelledby="titre-mes-inquietudes">
      <h3 id="titre-mes-inquietudes" className="text-xl font-semibold">Suivi de mes inquiétudes</h3>
      <div className="mt-4">
        {query.isLoading ? (
          <LoadingState label="Chargement de vos inquiétudes…" />
        ) : failure && !query.data ? (
          failure.status === 401 ? null : <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <p className="text-slate-700">Vous n’avez encore fait remonter aucune inquiétude.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((concern) => (
              <li key={concern.id} id={concern.reference} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-600">{concern.reference} · {CONCERN_TOPIC_LABELS[concern.topic]}</p>
                <p className="mt-1 font-semibold text-slate-950">{concern.subject}</p>
                <ol className="mt-3 space-y-2 border-l-2 border-teal-200 pl-4" aria-label={`Étapes de ${concern.reference}`}>
                  {concern.trail.map((step) => (
                    <li key={`${step.status}-${step.at}`}>
                      <p className="font-medium text-slate-900">{CONCERN_STATUS_LABELS[step.status]} · <time className="font-normal text-slate-600" dateTime={step.at}>{formatDateTime(step.at)}</time></p>
                      {step.comment && <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-slate-800">{step.comment}</p>}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/**
 * « Participer » (lot L14) : soutenir une demande (F52), faire remonter une inquiétude avec suivi (F51).
 * `cityParticipation` : bloc composé par la route (module participation, lot L19 : consultations, idées, contributions).
 */
export function ParticipationPage({ cityParticipation }: { cityParticipation?: ReactNode } = {}) {
  const access = useCitizenAccess()
  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace", href: "/espace" }, { label: "Participer" }]}
        title="Participer à la vie de Nova Terra"
        lead="Soutenez les signalements de vos voisins et faites remonter vos inquiétudes : chaque message reçoit un accusé de réception et une réponse suivie."
      />
      <PageBody>
        {!access.profile ? (
          <CitizenAccessState access={access} returnTo="/espace/participation" />
        ) : (
          <div className="space-y-12">
            {cityParticipation}
            <PublicRequests />
            <section aria-labelledby="titre-inquietude" className="space-y-6">
              <div>
                <h2 id="titre-inquietude" className="text-2xl font-semibold tracking-tight">Faire remonter une inquiétude</h2>
                <p className="mt-1 text-slate-700">
                  Une question sur l’usage de vos données, un service, la sécurité de votre compte ? Un agent vous répond ici.{" "}
                  <Link href="/vos-donnees" className="inline-flex items-center gap-1 font-medium text-teal-800 underline underline-offset-4"><ShieldCheck className="size-4" aria-hidden="true" />Comprendre l’usage de vos données</Link>
                </p>
              </div>
              <ConcernForm />
              <MyConcerns />
            </section>
          </div>
        )}
      </PageBody>
    </>
  )
}
