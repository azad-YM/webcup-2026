"use client"
import Link from "next/link"
import { LogIn } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PARTICIPATION_POLLING_MS, useMyParticipationQuery } from "../../core/application/rtk-api/city-participation"
import { NOT_CITIZEN } from "../../core/domain/participation"
import { formatDateTime, IDEA_STATUS_LABELS, RATING_LABELS, type MyContribution, type MyIdea } from "../../core/domain/participation"
import { consultationHref, IdeaStatusBadge, PhaseBadge, useLogoutOnUnauthorized } from "../components/participation-ui"

function ContributionItem({ item }: { item: MyContribution }) {
  const consultation = item.consultation
  const choice = consultation?.options.find((option) => option.id === item.choice)?.label
  return (
    <article id={item.reference} aria-labelledby={`contribution-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        {consultation && <PhaseBadge phase={consultation.phase} />}
        <span className="text-sm text-slate-700">Numéro {item.reference}</span>
      </div>
      <h3 id={`contribution-${item.id}`} className="mt-2 text-lg font-semibold text-slate-950">{consultation?.title ?? "Consultation retirée"}</h3>
      <p className="mt-1 text-slate-700">
        Reçue le <time dateTime={item.submittedAt}>{formatDateTime(item.submittedAt)}</time>
        {item.revised && <>, modifiée le <time dateTime={item.updatedAt}>{formatDateTime(item.updatedAt)}</time></>}
      </p>
      <ul className="mt-2 list-disc space-y-1 ps-5 text-slate-800">
        {choice && <li>Votre choix : {choice}</li>}
        {item.rating && <li>Votre appréciation : {RATING_LABELS[item.rating]}</li>}
        {item.comment && <li className="whitespace-pre-wrap">Votre commentaire : {item.comment}</li>}
      </ul>
      {consultation?.visible && (
        <Link href={consultationHref(consultation.id)} className="mt-3 inline-flex font-medium text-teal-800 underline underline-offset-4">
          {consultation.phase === "open" ? "Modifier ma participation" : "Voir les résultats et ce que la ville en a retenu"}
          <span className="sr-only"> : {consultation.title}</span>
        </Link>
      )}
    </article>
  )
}

function IdeaItem({ idea }: { idea: MyIdea }) {
  return (
    <article id={idea.reference} aria-labelledby={`mon-idee-${idea.id}`} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <IdeaStatusBadge status={idea.status} />
        <span className="text-sm text-slate-700">Numéro {idea.reference}</span>
        {!idea.public && <span className="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-medium text-amber-950">Non publiée</span>}
      </div>
      <h3 id={`mon-idee-${idea.id}`} className="mt-2 text-lg font-semibold text-slate-950">{idea.title}</h3>
      {!idea.public && idea.hiddenReason && <p className="mt-2 text-slate-800"><span className="font-medium">Pourquoi elle n’est pas affichée publiquement :</span> {idea.hiddenReason}</p>}
      <ol className="mt-3 space-y-2 border-s-2 border-slate-200 ps-4" aria-label={`Suivi de l’idée ${idea.reference}`}>
        {idea.trail.map((step) => (
          <li key={`${step.status}-${step.at}`}>
            <p className="font-medium text-slate-900">{IDEA_STATUS_LABELS[step.status]} · <time className="font-normal text-slate-600" dateTime={step.at}>{formatDateTime(step.at)}</time></p>
            {step.comment && <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-slate-800">{step.comment}</p>}
          </li>
        ))}
      </ol>
    </article>
  )
}

/** « Mes contributions » (F65, F66, F68) : accusés de réception, réponses et suivi des idées. */
export function MyContributionsPage() {
  const { ready, hasToken } = useSession()
  const query = useMyParticipationQuery(undefined, { skip: !ready || !hasToken, pollingInterval: PARTICIPATION_POLLING_MS })
  useLogoutOnUnauthorized(query.error)
  const failure = toQueryError(query.error)
  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace", href: "/espace" }, { label: "Mes contributions" }]}
        title="Mes contributions"
        lead="Vos réponses aux consultations, avec leur numéro et leur date, et le suivi de vos idées."
      />
      <PageBody>
        {!ready ? (
          <LoadingState label="Vérification de votre session…" />
        ) : !hasToken ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" role="status">
            <LogIn className="size-8 text-teal-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Connectez-vous pour voir vos contributions</h2>
            <Link href="/connexion?retour=/espace/contributions" className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Se connecter</Link>
          </div>
        ) : failure?.code === NOT_CITIZEN ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">{failure.data} <Link href="/espace" className="font-medium underline">Mon espace</Link></p>
        ) : failure && failure.status !== 401 ? (
          <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : !query.data ? (
          <LoadingState label="Chargement de vos contributions…" />
        ) : (
          <div className="space-y-12">
            <section aria-labelledby="titre-mes-reponses">
              <h2 id="titre-mes-reponses" className="text-2xl font-semibold tracking-tight">Mes réponses aux consultations</h2>
              <div className="mt-5">
                {query.data.contributions.length === 0 ? (
                  <EmptyState title="Vous n’avez pas encore participé à une consultation."><Link href="/participer" className="font-medium text-teal-800 underline">Voir les consultations ouvertes</Link></EmptyState>
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2">{query.data.contributions.map((item) => <li key={item.id}><ContributionItem item={item} /></li>)}</ul>
                )}
              </div>
            </section>
            <section aria-labelledby="titre-mes-idees">
              <h2 id="titre-mes-idees" className="text-2xl font-semibold tracking-tight">Mes idées</h2>
              <div className="mt-5">
                {query.data.ideas.length === 0 ? (
                  <EmptyState title="Vous n’avez pas encore proposé d’idée."><Link href="/participer/idees" className="font-medium text-teal-800 underline">Proposer une idée</Link></EmptyState>
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2">{query.data.ideas.map((idea) => <li key={idea.id}><IdeaItem idea={idea} /></li>)}</ul>
                )}
              </div>
            </section>
          </div>
        )}
      </PageBody>
    </>
  )
}
