"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, CalendarClock, LogIn } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { FormAnnouncement, TextAreaField } from "@/modules/shared/ui/components/form-field"
import { useSession } from "@/modules/shared/ui/store-provider"
import { useContributeMutation, useGetConsultationQuery, useMyParticipationQuery } from "../../core/application/rtk-api/city-participation"
import { NOT_CITIZEN } from "../../core/domain/participation"
import {
  COMMENT_MAX,
  formatDateTime,
  RATING_LABELS,
  RATINGS,
  type Consultation,
  type ContributionDraft,
  type ContributionReceipt,
  type Rating,
} from "../../core/domain/participation"
import { ConsultationResultsView, PhaseBadge, projectHref, UnofficialNotice, useLogoutOnUnauthorized } from "../components/participation-ui"

function Receipt({ receipt, consultation }: { receipt: ContributionReceipt; consultation: Consultation }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [receipt.updatedAt])
  const choice = consultation.options.find((option) => option.id === receipt.choice)?.label
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
      <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">Votre participation est enregistrée</h3>
      <p className="mt-1">
        Numéro <strong>{receipt.reference}</strong>, reçue le <time dateTime={receipt.submittedAt}>{formatDateTime(receipt.submittedAt)}</time>
        {receipt.revised && <> et modifiée le <time dateTime={receipt.updatedAt}>{formatDateTime(receipt.updatedAt)}</time></>}.
      </p>
      <ul className="mt-2 list-disc space-y-1 ps-5">
        {choice && <li>Votre choix : {choice}</li>}
        {receipt.rating && <li>Votre appréciation : {RATING_LABELS[receipt.rating]}</li>}
        {receipt.comment && <li className="whitespace-pre-wrap">Votre commentaire : {receipt.comment}</li>}
      </ul>
      <p className="mt-2">Vous pouvez la modifier jusqu’au {formatDateTime(consultation.closesAt)}. Retrouvez-la dans <Link href="/espace/contributions" className="font-medium underline">Mes contributions</Link>.</p>
    </div>
  )
}

function ContributionForm({ consultation }: { consultation: Consultation }) {
  const mine = useMyParticipationQuery()
  useLogoutOnUnauthorized(mine.error)
  const existing = mine.data?.contributions.find((item) => item.consultationId === consultation.id) ?? null
  const [draft, setDraft] = useState<ContributionDraft | null>(null)
  const [receipt, setReceipt] = useState<ContributionReceipt | null>(null)
  const [contribute, state] = useContributeMutation()
  useLogoutOnUnauthorized(state.error)
  const sending = useRef(false)
  const current: ContributionDraft = draft ?? {
    consultationId: consultation.id,
    choice: existing?.choice ?? null,
    rating: existing?.rating ?? null,
    comment: existing?.comment ?? "",
  }
  const failure = toQueryError(state.error)
  const notCitizen = toQueryError(mine.error)?.code === NOT_CITIZEN || failure?.code === NOT_CITIZEN
  const shown = receipt ?? existing

  if (mine.isLoading) return <LoadingState label="Chargement de votre participation…" />
  if (notCitizen) {
    return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">Ce compte n’a pas d’espace citoyen. <Link href="/espace" className="font-medium underline">Activez-le depuis « Mon espace »</Link> pour participer.</p>
  }

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (sending.current) return
    sending.current = true
    try {
      setReceipt(await contribute({ consultation, draft: current }).unwrap())
      setDraft(null)
    } catch {
      /* Message affiché par FormAnnouncement. */
    } finally {
      sending.current = false
    }
  }

  return (
    <div className="space-y-6">
      {shown && <Receipt receipt={shown} consultation={consultation} />}
      <form onSubmit={(event) => void send(event)} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="titre-repondre">
        <h2 id="titre-repondre" className="text-xl font-semibold">{shown ? "Modifier ma participation" : "Ma participation"}</h2>
        {consultation.kind === "consultation" ? (
          <fieldset>
            <legend className="font-medium text-slate-900">{consultation.question}</legend>
            <div className="mt-3 space-y-2">
              {consultation.options.map((option) => (
                <label key={option.id} className="flex items-start gap-3 rounded-xl border border-slate-300 p-3">
                  <input type="radio" name="choix" className="mt-1 size-4 accent-teal-700" value={option.id} checked={current.choice === option.id} onChange={() => setDraft({ ...current, choice: option.id })} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <fieldset>
            <legend className="font-medium text-slate-900">Votre appréciation <span className="font-normal text-slate-600">(facultatif si vous écrivez votre avis)</span></legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {RATINGS.map((rating: Rating) => (
                <label key={rating} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2">
                  <input type="radio" name="appreciation" className="size-4 accent-teal-700" value={rating} checked={current.rating === rating} onChange={() => setDraft({ ...current, rating })} />
                  {RATING_LABELS[rating]}
                </label>
              ))}
              {current.rating && <button type="button" className="text-sm text-slate-700 underline" onClick={() => setDraft({ ...current, rating: null })}>Effacer l’appréciation</button>}
            </div>
          </fieldset>
        )}
        <TextAreaField
          id="commentaire"
          label={consultation.kind === "opinion" ? "Votre avis" : "Commentaire"}
          optional={consultation.kind === "consultation"}
          hint={`${COMMENT_MAX} caractères au maximum. N’indiquez pas de données personnelles.`}
          rows={5}
          maxLength={COMMENT_MAX}
          value={current.comment}
          onChange={(event) => setDraft({ ...current, comment: event.target.value })}
        />
        <FormAnnouncement tone="error">{failure && failure.status !== 401 ? failure.data : null}</FormAnnouncement>
        <button type="submit" disabled={state.isLoading} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {state.isLoading ? "Envoi…" : shown ? "Enregistrer la modification" : "Envoyer ma participation"}
        </button>
      </form>
    </div>
  )
}

function ConsultationBody({ consultation }: { consultation: Consultation }) {
  const { ready, hasToken } = useSession()
  return (
    <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <PhaseBadge phase={consultation.phase} />
          <span className="inline-flex items-center gap-2 text-slate-700">
            <CalendarClock className="size-4" aria-hidden="true" />
            Du <time dateTime={consultation.opensAt}>{formatDateTime(consultation.opensAt)}</time> au <time dateTime={consultation.closesAt}>{formatDateTime(consultation.closesAt)}</time>
          </span>
        </div>
        {consultation.kind === "opinion" && <UnofficialNotice />}
        <p className="text-xl font-medium text-slate-950">{consultation.question}</p>
        {consultation.description.length > 0 && <div className="space-y-3 text-lg leading-8 text-slate-800">{consultation.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}
        {consultation.projectId && consultation.projectTitle && (
          <p>Projet concerné : <Link href={projectHref(consultation.projectId)} className="font-medium text-teal-800 underline underline-offset-4">{consultation.projectTitle}</Link></p>
        )}
        {consultation.kind === "consultation" && consultation.phase !== "closed" && (
          <div>
            <h2 className="text-lg font-semibold">Choix proposés</h2>
            <ul className="mt-2 list-disc space-y-1 ps-5">{consultation.options.map((option) => <li key={option.id}>{option.label}</li>)}</ul>
          </div>
        )}
        {consultation.phase === "closed" && <ConsultationResultsView consultation={consultation} />}
      </div>
      <div>
        {consultation.phase === "upcoming" ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-800">Vous pourrez participer à partir du {formatDateTime(consultation.opensAt)}.</p>
        ) : consultation.phase === "closed" ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-800">Cette consultation est terminée : {consultation.contributionCount} habitant{consultation.contributionCount > 1 ? "s ont" : " a"} participé. Merci !</p>
        ) : !ready ? (
          <LoadingState label="Vérification de votre session…" />
        ) : !hasToken ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6" role="status">
            <LogIn className="size-8 text-teal-700" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-semibold">Connectez-vous pour participer</h2>
            <p className="mt-2 text-slate-700">Une seule participation par habitant, que vous pourrez modifier jusqu’à la clôture.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/connexion?retour=/participer" className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Se connecter</Link>
              <Link href="/inscription" className="rounded-xl border border-slate-300 px-5 py-3 font-medium hover:bg-slate-50">Créer un compte</Link>
            </div>
          </div>
        ) : (
          <ContributionForm consultation={consultation} />
        )}
      </div>
    </div>
  )
}

/** Une consultation (`/participer/consultation?id=…`) : question, participation, résultats et compte rendu. */
export function ConsultationPage() {
  const id = useSearchParams().get("id") ?? ""
  const { data, error, isFetching, refetch } = useGetConsultationQuery(id, { skip: !id })
  const failure = toQueryError(error)
  return (
    <>
      <PageHeader trail={[{ label: "Participer", href: "/participer" }, { label: data?.title ?? "Consultation" }]} title={data?.title ?? "Consultation"} />
      <PageBody>
        {!id || failure?.status === 404 ? (
          <EmptyState title="Cette consultation est introuvable.">
            <Link href="/participer" className="font-medium text-teal-800 underline">Voir les consultations</Link>
          </EmptyState>
        ) : failure ? (
          <ErrorState message={failure.data} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label="Chargement de la consultation…" />
        ) : (
          <ConsultationBody consultation={data} />
        )}
        <p className="mt-10">
          <Link href="/participer" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
            <ArrowLeft className="size-4" aria-hidden="true" /> Toutes les consultations
          </Link>
        </p>
      </PageBody>
    </>
  )
}
