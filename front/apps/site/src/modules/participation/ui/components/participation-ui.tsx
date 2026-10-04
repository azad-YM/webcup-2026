"use client"
import { useEffect } from "react"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { ArrowRight, CalendarClock, Info } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import {
  formatDate,
  formatDateTime,
  IDEA_STATUS_LABELS,
  KIND_LABELS,
  percent,
  PHASE_LABELS,
  PROJECT_STATUS_LABELS,
  RATING_LABELS,
  type Consultation,
  type ConsultationPhase,
  type IdeaStatus,
  type ProjectStatus,
} from "../../core/domain/participation"

const PROJECT_TONES: Record<ProjectStatus, StatusTone> = { study: "pending", in_progress: "progress", done: "success" }
const PHASE_TONES: Record<ConsultationPhase, StatusTone> = { upcoming: "pending", open: "success", closed: "neutral" }
const IDEA_TONES: Record<IdeaStatus, StatusTone> = { received: "pending", in_review: "progress", accepted: "info", rejected: "danger", done: "success" }

export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) =>
  <StatusBadge tone={PROJECT_TONES[status]} label={PROJECT_STATUS_LABELS[status]} srPrefix="Avancement :" />
export const PhaseBadge = ({ phase }: { phase: ConsultationPhase }) =>
  <StatusBadge tone={PHASE_TONES[phase]} label={PHASE_LABELS[phase]} srPrefix="Période :" />
export const IdeaStatusBadge = ({ status }: { status: IdeaStatus }) =>
  <StatusBadge tone={IDEA_TONES[status]} label={IDEA_STATUS_LABELS[status]} srPrefix="Statut :" />

/** Un 401 sur une requête du citoyen ferme la session (une panne réseau, non). */
export function useLogoutOnUnauthorized(error: unknown) {
  const { logout } = useSession()
  const unauthorized = toQueryError(error)?.status === 401
  useEffect(() => { if (unauthorized) logout() }, [unauthorized, logout])
}

export const consultationHref = (id: string) => `/participer/consultation?id=${encodeURIComponent(id)}` as Route
export const projectHref = (id: string) => `/projets/projet?id=${encodeURIComponent(id)}` as Route

/** Rappel affiché sur chaque demande d’avis : ce n’est pas un vote officiel (F66). */
export function UnofficialNotice() {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-950">
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>Avis non officiel : il éclaire la décision de la ville, mais ce n’est pas un vote.</span>
    </p>
  )
}

export function ConsultationCard({ consultation, headingLevel = 3 }: { consultation: Consultation; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <article aria-labelledby={`consultation-${consultation.id}`} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <PhaseBadge phase={consultation.phase} />
        <span className="text-sm text-slate-600">{KIND_LABELS[consultation.kind]}{consultation.kind === "opinion" ? " (non officiel)" : ""}</span>
      </div>
      <Heading id={`consultation-${consultation.id}`} className="mt-3 text-lg font-semibold text-slate-950">{consultation.title}</Heading>
      <p className="mt-2 text-slate-800">{consultation.question}</p>
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
        {consultation.phase === "upcoming" ? <>Ouverture le <time dateTime={consultation.opensAt}>{formatDateTime(consultation.opensAt)}</time></>
          : consultation.phase === "open" ? <>Jusqu’au <time dateTime={consultation.closesAt}>{formatDateTime(consultation.closesAt)}</time></>
          : <>Terminée le <time dateTime={consultation.closesAt}>{formatDate(consultation.closesAt)}</time></>}
      </p>
      {consultation.projectTitle && <p className="mt-1 text-sm text-slate-700">Projet : {consultation.projectTitle}</p>}
      <p className="mt-1 text-sm text-slate-700">{consultation.contributionCount} participation{consultation.contributionCount > 1 ? "s" : ""}</p>
      <Link href={consultationHref(consultation.id)} className="mt-auto inline-flex items-center gap-2 pt-4 font-medium text-teal-800 underline underline-offset-4">
        {consultation.phase === "open" ? "Participer" : consultation.phase === "closed" ? "Voir les résultats" : "Lire la question"}
        <span className="sr-only"> : {consultation.title}</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

/** Résultat agrégé publié à la clôture, puis « Ce que la ville en a retenu ». */
export function ConsultationResultsView({ consultation }: { consultation: Consultation }) {
  const results = consultation.results
  if (!results) return null
  const rows = consultation.kind === "consultation"
    ? results.choices.map((choice) => ({ key: choice.id, label: choice.label, count: choice.count }))
    : results.ratings.map((rating) => ({ key: rating.rating, label: RATING_LABELS[rating.rating], count: rating.count }))
  return (
    <section aria-labelledby="titre-resultats" className="space-y-4">
      <h2 id="titre-resultats" className="text-2xl font-semibold tracking-tight">Résultats</h2>
      <p className="text-slate-800">{results.total} participation{results.total > 1 ? "s" : ""}{results.comments > 0 ? `, dont ${results.comments} avec un commentaire` : ""}.</p>
      {consultation.kind === "opinion" && <UnofficialNotice />}
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.key}>
            <dt className="flex justify-between gap-3 font-medium text-slate-900"><span>{row.label}</span><span>{percent(row.count, results.total)} % ({row.count})</span></dt>
            <dd className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <span className="block h-full rounded-full bg-teal-700" style={{ width: `${percent(row.count, results.total)}%` }} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-950">Ce que la ville en a retenu</h3>
        {consultation.outcome ? (
          <>
            <p className="mt-1 text-sm text-slate-600">Publié le <time dateTime={consultation.outcome.publishedAt ?? undefined}>{formatDate(consultation.outcome.publishedAt)}</time></p>
            <div className="mt-3 space-y-3 text-slate-800">{consultation.outcome.text.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </>
        ) : (
          <p className="mt-2 text-slate-700">Les services de la ville analysent les réponses. Leur compte rendu sera publié ici.</p>
        )}
      </div>
    </section>
  )
}
