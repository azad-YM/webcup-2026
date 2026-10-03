"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { useListPublicationsQuery } from "../../core/application/rtk-api/public"
import { findPublication, formatPublicationDate, type Publication } from "../../core/domain/publication"
import { PublicationCard } from "../components/content-cards"

function PublicationDetail({ publication }: { publication: Publication }) {
  return (
    <article className="max-w-3xl">
      <p className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-amber-100 px-3 py-0.5 font-medium text-amber-900">{publication.category}</span>
        <span className="text-slate-700">Publié le <time dateTime={publication.publishedAt}>{formatPublicationDate(publication.publishedAt)}</time></span>
      </p>
      <div className="mt-6 space-y-4 text-lg leading-8 text-slate-800">
        {publication.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <p className="mt-10">
        <Link href="/actualites" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
          <ArrowLeft className="size-4" aria-hidden="true" /> Toutes les actualités
        </Link>
      </p>
    </article>
  )
}

export function PublicationsPage() {
  const articleId = useSearchParams().get("article")
  const { data, error, isFetching, refetch } = useListPublicationsQuery()
  const publication = data && articleId ? findPublication(data, articleId) : null
  return (
    <>
      {publication
        ? <PageHeader trail={[{ label: "Actualités", href: "/actualites" }, { label: publication.title }]} title={publication.title} lead={publication.summary} />
        : <PageHeader trail={[{ label: "Actualités" }]} title="Actualités" lead="Les informations publiées par la ville de Nova Terra." />}
      <PageBody>
        {error ? (
          <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les actualités."} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label="Chargement des actualités"><SkeletonCards count={3} /></LoadingState>
        ) : articleId && !publication ? (
          <EmptyState title="Cet article est introuvable.">
            <Link href="/actualites" className="font-medium text-teal-800 underline">Voir toutes les actualités</Link>
          </EmptyState>
        ) : publication ? (
          <PublicationDetail publication={publication} />
        ) : data.length === 0 ? (
          <EmptyState title="Aucune actualité publiée pour le moment." />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => <li key={item.id}><PublicationCard publication={item} headingLevel={2} /></li>)}
          </ul>
        )}
      </PageBody>
    </>
  )
}
