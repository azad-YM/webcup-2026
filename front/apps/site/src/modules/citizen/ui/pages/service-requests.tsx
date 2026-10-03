"use client"
import { useEffect } from "react"
import Link from "next/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, MapPin, Megaphone, MessageSquare } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { RequestTimeline, StatusBadge } from "../components/request-status"
import { REQUESTS_POLLING_MS, useGetMyRequestQuery, useListMyRequestsQuery } from "../../core/application/rtk-api/service-requests"
import { formatDateTime, REQUEST_TYPE_LABELS, type ServiceRequest } from "../../core/domain/service-request"

const requestHref = (reference: string) => `/espace/demandes?ref=${encodeURIComponent(reference)}` as Route

/** Un 401 sur les demandes ferme la session, comme la garde de l'espace. */
function useLogoutOnUnauthorized(error: unknown) {
  const { logout } = useSession()
  const unauthorized = toQueryError(error)?.status === 401
  useEffect(() => {
    if (unauthorized) logout()
  }, [unauthorized, logout])
}

/** « Mes demandes » (D11, F26) : historique, puis détail d'une demande via `?ref=` (export statique). */
export function ServiceRequestsPage() {
  const access = useCitizenAccess()
  const reference = useSearchParams().get("ref")
  return (
    <>
      <PageHeader
        trail={reference
          ? [{ label: "Mon espace", href: "/espace" }, { label: "Mes demandes", href: "/espace/demandes" }, { label: reference }]
          : [{ label: "Mon espace", href: "/espace" }, { label: "Mes demandes" }]}
        title={reference ? `Demande ${reference}` : "Mes demandes"}
        lead={reference ? undefined : "Retrouvez vos messages à la mairie et vos signalements, leur état et chaque étape de leur traitement."}
      />
      <PageBody>
        {!access.profile
          ? <CitizenAccessState access={access} returnTo="/espace/demandes" />
          : reference ? <RequestDetail reference={reference} /> : <RequestHistory />}
      </PageBody>
    </>
  )
}

function NewRequestLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href={"/espace/demandes/nouvelle?type=contact" as Route} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">
        <MessageSquare className="size-5" aria-hidden="true" /> Contacter la mairie
      </Link>
      <Link href={"/espace/demandes/nouvelle?type=report" as Route} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">
        <Megaphone className="size-5" aria-hidden="true" /> Signaler un problème
      </Link>
    </div>
  )
}

function RequestHistory() {
  const query = useListMyRequestsQuery(undefined, { pollingInterval: REQUESTS_POLLING_MS })
  useLogoutOnUnauthorized(query.error)
  const failure = toQueryError(query.error)
  const requests = query.data ?? []
  return (
    <div className="space-y-8">
      <NewRequestLinks />
      <section aria-labelledby="titre-historique">
        <h2 id="titre-historique" className="text-2xl font-semibold tracking-tight">Historique</h2>
        <div className="mt-5">
          {query.isLoading ? (
            <LoadingState label="Chargement de vos demandes…"><SkeletonCards count={2} /></LoadingState>
          ) : failure && !query.data ? (
            failure.status === 401 ? null : <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          ) : requests.length === 0 ? (
            <EmptyState title="Vous n’avez encore envoyé aucune demande.">
              Écrivez à la mairie ou signalez un problème dans votre quartier : vous suivrez ici chaque étape.
            </EmptyState>
          ) : (
            <>
              <p className="sr-only" aria-live="polite">{requests.length} demande{requests.length > 1 ? "s" : ""}</p>
              <ul className="space-y-4">
                {requests.map((request) => <li key={request.id}><RequestCard request={request} /></li>)}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function RequestCard({ request }: { request: ServiceRequest }) {
  return (
    <Link href={requestHref(request.reference)} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-slate-600">{REQUEST_TYPE_LABELS[request.type]} · {request.reference} · envoyée le <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time></p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">{request.subject}</h3>
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status={request.status} />
        <span className="inline-flex items-center gap-1 font-medium text-teal-800">Suivre <ArrowRight className="size-4" aria-hidden="true" /></span>
      </div>
    </Link>
  )
}

function RequestDetail({ reference }: { reference: string }) {
  const query = useGetMyRequestQuery(reference, { pollingInterval: REQUESTS_POLLING_MS })
  useLogoutOnUnauthorized(query.error)
  const failure = toQueryError(query.error)
  const request = query.data
  return (
    <div className="space-y-6">
      <Link href="/espace/demandes" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
        <ArrowLeft className="size-4" aria-hidden="true" /> Toutes mes demandes
      </Link>
      {query.isLoading ? (
        <LoadingState label="Chargement de la demande…" />
      ) : failure && !request ? (
        failure.status === 401 ? null : failure.status === 404
          ? <EmptyState title="Cette demande est introuvable dans votre espace.">Vérifiez la référence ou revenez à la liste de vos demandes.</EmptyState>
          : <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : request ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <article aria-labelledby="titre-demande" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-sm text-slate-600">{REQUEST_TYPE_LABELS[request.type]} · envoyée le <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time></p>
            <h2 id="titre-demande" className="mt-1 text-2xl font-semibold text-slate-950">{request.subject}</h2>
            <div className="mt-3"><StatusBadge status={request.status} /></div>
            {request.location && (
              <p className="mt-5 flex items-start gap-2 text-slate-800"><MapPin className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><span><span className="font-medium">Lieu : </span>{request.location}</span></p>
            )}
            <h3 className="mt-6 font-semibold text-slate-950">Votre message</h3>
            <p className="mt-2 whitespace-pre-wrap text-slate-800">{request.description}</p>
          </article>
          <section aria-labelledby="titre-etapes" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 id="titre-etapes" className="text-lg font-semibold">Étapes du traitement</h2>
            <div className="mt-5" aria-live="polite"><RequestTimeline steps={request.steps} /></div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
