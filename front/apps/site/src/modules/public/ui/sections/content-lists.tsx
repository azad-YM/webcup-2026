"use client"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CONTENT_POLLING_MS, useListPublicationsQuery, useListServicesQuery } from "../../core/application/rtk-api/public"
import { featuredServices } from "../../core/domain/municipal-service"
import { latestPublications } from "../../core/domain/publication"
import { PublicationCard, ServiceCard } from "../components/content-cards"

export function FeaturedServices() {
  const { data, error, isFetching, refetch } = useListServicesQuery(undefined, { pollingInterval: CONTENT_POLLING_MS })
  if (error) return <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les services."} onRetry={() => void refetch()} retrying={isFetching} />
  if (!data) return <LoadingState label="Chargement des services"><SkeletonCards count={4} /></LoadingState>
  const featured = featuredServices(data)
  if (featured.length === 0) return <EmptyState title="Aucun service mis en avant pour le moment." />
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {featured.map((service) => <li key={service.id}><ServiceCard service={service} /></li>)}
    </ul>
  )
}

export function LatestPublications() {
  const { data, error, isFetching, refetch } = useListPublicationsQuery(undefined, { pollingInterval: CONTENT_POLLING_MS })
  if (error) return <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les actualités."} onRetry={() => void refetch()} retrying={isFetching} />
  if (!data) return <LoadingState label="Chargement des actualités"><SkeletonCards count={3} /></LoadingState>
  if (data.length === 0) return <EmptyState title="Aucune actualité publiée pour le moment." />
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {latestPublications(data).map((publication) => <li key={publication.id}><PublicationCard publication={publication} /></li>)}
    </ul>
  )
}
