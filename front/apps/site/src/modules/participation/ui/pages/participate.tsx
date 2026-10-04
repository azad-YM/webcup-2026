"use client"
import Link from "next/link"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { ArrowRight, Building2, Lightbulb, ListChecks } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PARTICIPATION_POLLING_MS, useListConsultationsQuery } from "../../core/application/rtk-api/city-participation"
import type { Consultation, ConsultationPhase } from "../../core/domain/participation"
import { ConsultationCard } from "../components/participation-ui"

function ConsultationGroup({ id, title, items, empty }: { id: string; title: string; items: Consultation[]; empty: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-semibold tracking-tight">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-slate-700">{empty}</p>
      ) : (
        <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <li key={item.id}><ConsultationCard consultation={item} /></li>)}
        </ul>
      )}
    </section>
  )
}

/** « Participer » : consultations ouvertes, à venir et terminées (F65, F66), accès à la boîte à idées (F68). */
export function ParticipatePage() {
  const { hasToken } = useSession()
  const { data, error, isFetching, refetch } = useListConsultationsQuery(undefined, polling(PARTICIPATION_POLLING_MS))
  const byPhase = (phase: ConsultationPhase) => (data ?? []).filter((item) => item.phase === phase)
  return (
    <>
      <PageHeader
        trail={[{ label: "Participer" }]}
        title="Participer aux décisions de Nova Terra"
        lead="Répondez aux consultations de la ville, donnez votre avis sur ses projets et proposez vos idées. Chaque participation reçoit un accusé de réception, et la ville publie ce qu’elle en a retenu."
      />
      <PageBody>
        <ul className="mb-12 grid gap-5 md:grid-cols-3">
          <li>
            <Link href="/projets" className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md">
              <Building2 className="size-7 text-teal-700" aria-hidden="true" />
              <span className="mt-4 text-lg font-semibold text-slate-950">Les projets de la ville</span>
              <span className="mt-2 flex-1 text-slate-700">Ce qui est à l’étude, en cours ou terminé dans chaque quartier.</span>
              <span className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800">Voir les projets <ArrowRight className="size-4" aria-hidden="true" /></span>
            </Link>
          </li>
          <li>
            <Link href="/participer/idees" className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md">
              <Lightbulb className="size-7 text-teal-700" aria-hidden="true" />
              <span className="mt-4 text-lg font-semibold text-slate-950">La boîte à idées</span>
              <span className="mt-2 flex-1 text-slate-700">Proposez une idée pour améliorer la colonie et suivez sa prise en compte.</span>
              <span className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800">Proposer une idée <ArrowRight className="size-4" aria-hidden="true" /></span>
            </Link>
          </li>
          <li>
            <Link href={hasToken ? "/espace/contributions" : "/connexion?retour=/espace/contributions"} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md">
              <ListChecks className="size-7 text-teal-700" aria-hidden="true" />
              <span className="mt-4 text-lg font-semibold text-slate-950">Mes contributions</span>
              <span className="mt-2 flex-1 text-slate-700">Vos réponses, leurs accusés de réception et le suivi de vos idées.</span>
              <span className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800">{hasToken ? "Ouvrir" : "Se connecter"} <ArrowRight className="size-4" aria-hidden="true" /></span>
            </Link>
          </li>
        </ul>
        {error ? (
          <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les consultations."} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label="Chargement des consultations"><SkeletonCards count={3} /></LoadingState>
        ) : data.length === 0 ? (
          <EmptyState title="Aucune consultation pour le moment.">La ville publiera ici ses prochaines questions aux habitants.</EmptyState>
        ) : (
          <div className="space-y-12">
            <ConsultationGroup id="titre-ouvertes" title="Consultations ouvertes" items={byPhase("open")} empty="Aucune consultation n’est ouverte en ce moment." />
            {byPhase("upcoming").length > 0 && <ConsultationGroup id="titre-a-venir" title="Bientôt ouvertes" items={byPhase("upcoming")} empty="" />}
            <ConsultationGroup id="titre-terminees" title="Résultats des consultations terminées" items={byPhase("closed")} empty="Aucune consultation terminée pour l’instant." />
          </div>
        )}
      </PageBody>
    </>
  )
}
