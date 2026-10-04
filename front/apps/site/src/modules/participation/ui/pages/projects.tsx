"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, MapPin } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { SelectField } from "@/modules/shared/ui/components/form-field"
import { PARTICIPATION_POLLING_MS, useListDistrictsQuery, useListProjectsQuery } from "../../core/application/rtk-api/city-participation"
import { formatDate, PROJECT_STATUS_LABELS, type Project, type ProjectFilters, type ProjectStatus } from "../../core/domain/participation"
import { projectHref, ProjectStatusBadge } from "../components/participation-ui"

const STATUS_OPTIONS = (Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }))

function ProjectCard({ project }: { project: Project }) {
  return (
    <article aria-labelledby={`projet-${project.id}`} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-2">
        <ProjectStatusBadge status={project.status} />
        <span className="inline-flex items-center gap-1 text-sm text-slate-700"><MapPin className="size-4" aria-hidden="true" />{project.district ?? "Toute la ville"}</span>
      </div>
      <h2 id={`projet-${project.id}`} className="mt-3 text-xl font-semibold text-slate-950">{project.title}</h2>
      <p className="mt-2 flex-1 text-slate-800">{project.summary}</p>
      {project.nextStep && <p className="mt-3 text-sm text-slate-800"><span className="font-medium">Prochaine étape :</span> {project.nextStep}</p>}
      <p className="mt-2 text-sm text-slate-600">Mis à jour le <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time></p>
      <Link href={projectHref(project.id)} className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
        Voir le projet<span className="sr-only"> : {project.title}</span> <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

/** Projets en cours dans la ville (F67), filtrables par quartier et par avancement. */
export function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({ district: "", status: "" })
  const districts = useListDistrictsQuery()
  const { data, error, isFetching, refetch } = useListProjectsQuery(filters, { pollingInterval: PARTICIPATION_POLLING_MS })
  const districtOptions = [{ value: "city", label: "Toute la ville (projets communs)" }, ...(districts.data ?? []).map((value) => ({ value, label: value }))]
  return (
    <>
      <PageHeader
        trail={[{ label: "Projets" }]}
        title="Les projets de la ville"
        lead="Ce que Nova Terra étudie, construit ou vient de terminer, quartier par quartier, avec les prochaines étapes."
      />
      <PageBody>
        <form className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()} aria-label="Filtrer les projets">
          <SelectField id="filtre-quartier" label="Quartier" placeholder="Tous les quartiers" options={districtOptions} value={filters.district} onChange={(event) => setFilters({ ...filters, district: event.target.value })} />
          <SelectField id="filtre-etat" label="Avancement" placeholder="Tous les projets" options={STATUS_OPTIONS} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as ProjectStatus | "" })} />
        </form>
        {error ? (
          <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les projets."} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label="Chargement des projets"><SkeletonCards count={3} /></LoadingState>
        ) : data.length === 0 ? (
          <EmptyState title="Aucun projet ne correspond à ces critères.">Essayez un autre quartier ou un autre avancement.</EmptyState>
        ) : (
          <>
            <p role="status" className="mb-4 text-slate-700">{data.length} projet{data.length > 1 ? "s" : ""}</p>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.map((project) => <li key={project.id}><ProjectCard project={project} /></li>)}
            </ul>
          </>
        )}
        <p className="mt-10 text-slate-800">
          Une idée pour améliorer la colonie ? <Link href="/participer/idees" className="font-medium text-teal-800 underline underline-offset-4">Proposez-la dans la boîte à idées</Link>.
        </p>
      </PageBody>
    </>
  )
}
