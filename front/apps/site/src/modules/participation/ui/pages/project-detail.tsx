"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle, MapPin } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { useGetProjectQuery } from "../../core/application/rtk-api/city-participation"
import { formatDate, type Project } from "../../core/domain/participation"
import { ConsultationCard, ProjectStatusBadge } from "../components/participation-ui"

function ProjectBody({ project }: { project: Project }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-10">
        <div className="space-y-4 text-lg leading-8 text-slate-800">
          {project.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <section aria-labelledby="titre-consultations-projet">
          <h2 id="titre-consultations-projet" className="text-2xl font-semibold tracking-tight">Donner votre avis sur ce projet</h2>
          {project.consultations && project.consultations.length > 0 ? (
            <ul className="mt-5 grid gap-5 md:grid-cols-2">
              {project.consultations.map((item) => <li key={item.id}><ConsultationCard consultation={item} /></li>)}
            </ul>
          ) : (
            <p className="mt-3 text-slate-700">Aucune consultation n’est ouverte sur ce projet pour l’instant.</p>
          )}
        </section>
      </div>
      <aside aria-labelledby="titre-etapes" className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <span className="inline-flex items-center gap-1 text-sm text-slate-700"><MapPin className="size-4" aria-hidden="true" />{project.district ?? "Toute la ville"}</span>
          </div>
          {project.nextStep && (
            <p className="mt-4 text-slate-900"><span className="block font-semibold">Prochaine étape</span>{project.nextStep}</p>
          )}
          <h2 id="titre-etapes" className="mt-6 text-lg font-semibold">Étapes</h2>
          {project.steps.length === 0 ? (
            <p className="mt-2 text-slate-700">Le calendrier sera publié prochainement.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {project.steps.map((step) => (
                <li key={`${step.date}-${step.label}`} className="flex items-start gap-3">
                  {step.done
                    ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
                    : <Circle className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden="true" />}
                  <span>
                    <span className="block font-medium text-slate-900">{step.label}</span>
                    <span className="text-sm text-slate-700"><time dateTime={step.date}>{formatDate(step.date)}</time> · {step.done ? "réalisée" : "à venir"}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-6 text-sm text-slate-600">Mis à jour le <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time></p>
        </div>
      </aside>
    </div>
  )
}

/** Détail d’un projet (`/projets/projet?id=…`, export statique sans route dynamique). */
export function ProjectDetailPage() {
  const id = useSearchParams().get("id") ?? ""
  const { data, error, isFetching, refetch } = useGetProjectQuery(id, { skip: !id })
  const failure = toQueryError(error)
  return (
    <>
      <PageHeader trail={[{ label: "Projets", href: "/projets" }, { label: data?.title ?? "Projet" }]} title={data?.title ?? "Projet"} lead={data?.summary} />
      <PageBody>
        {!id || failure?.status === 404 ? (
          <EmptyState title="Ce projet est introuvable.">
            <Link href="/projets" className="font-medium text-teal-800 underline">Voir tous les projets</Link>
          </EmptyState>
        ) : failure ? (
          <ErrorState message={failure.data} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label="Chargement du projet…" />
        ) : (
          <ProjectBody project={data} />
        )}
        <p className="mt-10">
          <Link href="/projets" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
            <ArrowLeft className="size-4" aria-hidden="true" /> Tous les projets
          </Link>
        </p>
      </PageBody>
    </>
  )
}
