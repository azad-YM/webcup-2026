"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { LogIn } from "@boilerplate/shared-ui/components/icon"
import { FormProtection, useProtectedSubmit } from "@boilerplate/shared-ui/components/a11y"
import { siteEnv } from "@/config/env"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, LoadingState } from "@/modules/shared/ui/components/states"
import { FormAnnouncement, TextAreaField } from "@/modules/shared/ui/components/form-field"
import { useSession } from "@/modules/shared/ui/store-provider"
import { useMyParticipationQuery, useReviewServiceMutation, useServiceNameQuery } from "../../core/application/rtk-api/city-participation"
import {
  formatDateTime,
  NEED_MET_LABELS,
  NOT_CITIZEN,
  REVIEW_COMMENT_MAX,
  SCORE_LABELS,
  SCORES,
  validateServiceReview,
  type NeedMet,
  type ServiceReview,
  type ServiceReviewContext,
  type ServiceReviewDraft,
} from "../../core/domain/participation"
import { useLogoutOnUnauthorized } from "../components/participation-ui"

const choiceClass = "flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-700"

function ReviewForm({ serviceId, serviceName, context, contextReference }: { serviceId: string; serviceName: string; context: ServiceReviewContext; contextReference: string | null }) {
  const mine = useMyParticipationQuery()
  const period = new Date().toISOString().slice(0, 7)
  const existing = mine.data?.serviceReviews?.find((review) => review.serviceId === serviceId && review.period === period)
  const [draft, setDraft] = useState<ServiceReviewDraft>({ serviceId, rating: null, needMet: null, comment: "", context, contextReference })
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<ServiceReview | null>(null)
  const [review, { isLoading, error: sendError }] = useReviewServiceMutation()
  // L25 (F81, F82) : protection contre les robots et les envois multiples.
  const guard = useProtectedSubmit({ apiBaseUrl: siteEnv.apiBaseUrl, form: "avis-service" })
  useLogoutOnUnauthorized(sendError)
  const receipt = useRef<HTMLHeadingElement>(null)
  const failure = toQueryError(sendError)
  useEffect(() => { if (sent) receipt.current?.focus() }, [sent])
  useEffect(() => {
    if (existing && draft.rating === null) setDraft((current) => ({ ...current, rating: existing.rating, needMet: existing.needMet, comment: existing.comment ?? "" }))
  }, [existing, draft.rating])

  const send = async (event: FormEvent) => {
    event.preventDefault()
    const message = validateServiceReview(draft)
    setError(message)
    if (message) return
    try {
      const result = await guard.submit(draft, () => review(draft).unwrap())
      if (result !== undefined) setSent(result)
    } catch {
      /* Message affiché par FormAnnouncement. */
    }
  }

  if (failure?.code === NOT_CITIZEN) {
    return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">{failure.data} <Link href="/espace" className="font-medium underline">Mon espace</Link></p>
  }

  return (
    <div className="max-w-2xl space-y-5">
      {sent && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <h2 ref={receipt} tabIndex={-1} className="text-lg font-semibold outline-none">Merci, votre avis est bien reçu</h2>
          <p className="mt-1">Numéro <strong>{sent.reference}</strong>, {sent.updated ? "modifié" : "reçu"} le <time dateTime={sent.updatedAt}>{formatDateTime(sent.updatedAt)}</time>. Le service le lira ; s’il vous répond, vous serez prévenu dans votre espace.</p>
          <p className="mt-1"><Link href="/espace/contributions" className="font-medium underline">Voir mes contributions</Link></p>
        </div>
      )}
      {existing && !sent && (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm" role="status">
          Vous avez déjà donné votre avis sur ce service ce mois-ci (n° {existing.reference}). Vous pouvez le modifier ci-dessous.
        </p>
      )}
      <form onSubmit={(event) => void send(event)} noValidate className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="titre-avis" data-brouillon={`avis-${serviceId}`}>
        <h2 id="titre-avis" className="text-xl font-semibold">Votre avis sur « {serviceName} »</h2>
        <fieldset>
          <legend className="font-medium">Êtes-vous satisfait de ce service ?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            {SCORES.map((score) => (
              <label key={score} className={choiceClass}>
                <input type="radio" name="avis-note" className="size-4" checked={draft.rating === score} onChange={() => setDraft({ ...draft, rating: score })} />
                <span><span className="block font-semibold">{score} / 5</span><span className="text-sm">{SCORE_LABELS[score]}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-medium">Avez-vous obtenu ce dont vous aviez besoin ?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(NEED_MET_LABELS) as NeedMet[]).map((value) => (
              <label key={value} className={choiceClass}>
                <input type="radio" name="avis-besoin" className="size-4" checked={draft.needMet === value} onChange={() => setDraft({ ...draft, needMet: value })} />
                {NEED_MET_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>
        <TextAreaField id="avis-commentaire" label="Commentaire" optional hint="Ce qui s’est bien passé, ce qui pourrait être amélioré. N’indiquez pas de données personnelles." rows={5} maxLength={REVIEW_COMMENT_MAX} value={draft.comment} onChange={(event) => setDraft({ ...draft, comment: event.target.value })} />
        <FormProtection guard={guard} duplicateMessage="Votre avis a déjà été envoyé : il n’a pas été enregistré une seconde fois." />
        <FormAnnouncement tone="error">{error ?? guard.refusal ?? (failure && failure.status !== 401 ? failure.data : null)}</FormAnnouncement>
        <button type="submit" disabled={isLoading || guard.submitting} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isLoading ? "Envoi…" : existing ? "Modifier mon avis" : "Envoyer mon avis"}
        </button>
      </form>
    </div>
  )
}

/**
 * F76 : avis après avoir utilisé un service (`/espace/avis?service=<id>`, avec `demande=<numéro>` ou
 * `rendez-vous=<numéro>` quand l’avis est proposé après une demande close ou un rendez-vous passé).
 */
export function ServiceReviewPage() {
  const params = useSearchParams()
  const serviceId = params.get("service") ?? ""
  const request = params.get("demande")
  const appointment = params.get("rendez-vous")
  const context: ServiceReviewContext = request ? "request" : appointment ? "appointment" : "service"
  const { ready, hasToken } = useSession()
  const name = useServiceNameQuery(serviceId, { skip: serviceId === "" })
  const back = `/espace/avis?service=${encodeURIComponent(serviceId)}${request ? `&demande=${encodeURIComponent(request)}` : appointment ? `&rendez-vous=${encodeURIComponent(appointment)}` : ""}`

  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace", href: "/espace" }, { label: "Donner mon avis" }]}
        title="Donner mon avis sur un service"
        lead={request ? `Votre demande ${request} est close : dites-nous comment cela s’est passé.` : appointment ? `Votre rendez-vous ${appointment} est passé : dites-nous comment cela s’est passé.` : "Votre avis aide la ville à améliorer ses services. Il compte dans la note affichée sur la fiche du service, sans votre nom."}
      />
      <PageBody>
        {serviceId === "" ? (
          <EmptyState title="Choisissez d’abord le service à évaluer."><Link href="/services" className="font-medium text-teal-800 underline">Voir les services</Link></EmptyState>
        ) : !ready ? (
          <LoadingState label="Vérification de votre session…" />
        ) : !hasToken ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" role="status">
            <LogIn className="size-8 text-teal-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Connectez-vous pour donner votre avis</h2>
            <Link href={`/connexion?retour=${encodeURIComponent(back)}`} className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Se connecter</Link>
          </div>
        ) : name.isLoading ? (
          <LoadingState label="Chargement du service…" />
        ) : name.data === null ? (
          <EmptyState title="Ce service est introuvable."><Link href="/services" className="font-medium text-teal-800 underline">Voir les services</Link></EmptyState>
        ) : (
          <ReviewForm serviceId={serviceId} serviceName={name.data ?? serviceId} context={context} contextReference={request ?? appointment} />
        )}
      </PageBody>
    </>
  )
}
