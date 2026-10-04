"use client"
import { useEffect } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import Link from "next/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, FileText, MapPin, Megaphone, MessageSquare } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { RequestTimeline, StatusBadge } from "../components/request-status"
import { RequestConversation } from "../components/request-conversation"
import { RequestFilters, useRequestFilters } from "../components/request-filters"
import { applyFilters } from "../../core/domain/request-filters"
import { REQUESTS_POLLING_MS, useGetMyRequestQuery, useListMyRequestsQuery } from "../../core/application/rtk-api/service-requests"
import { CATEGORY_LABELS, formatDateTime, REQUEST_TYPE_LABELS, type ServiceRequest } from "../../core/domain/service-request"
import { useListMyNotificationsQuery, useMarkNotificationsReadMutation } from "../../core/application/rtk-api/notifications"

/** Ouvrir le détail d'une demande marque comme lues ses notifications (F49). */
function useReadRequestNotifications(reference: string, loaded: boolean) {
  const inbox = useListMyNotificationsQuery(undefined, { skip: !loaded })
  const [markRead] = useMarkNotificationsReadMutation()
  const ids = (inbox.data?.items ?? [])
    .filter((item) => !item.readAt && item.link === `/espace/demandes?ref=${encodeURIComponent(reference)}`)
    .map((item) => item.id)
  const key = ids.join(",")
  useEffect(() => {
    if (key) void markRead(key.split(","))
  }, [key, markRead])
}

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
  const query = useListMyRequestsQuery(undefined, polling(REQUESTS_POLLING_MS))
  useLogoutOnUnauthorized(query.error)
  const failure = toQueryError(query.error)
  const requests = query.data ?? []
  const [filters, setFilters, resetFilters] = useRequestFilters()
  const shown = applyFilters(requests, filters)
  return (
    <div className="space-y-8">
      <NewRequestLinks />
      {requests.length > 0 && (
        <p>
          <Link href={"/espace/demandes/recapitulatif" as Route} className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
            <FileText className="size-4" aria-hidden="true" /> Récapitulatif imprimable et téléchargeable (CSV)
          </Link>
        </p>
      )}
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
            <div className="space-y-5">
              <RequestFilters idPrefix="mes-demandes" items={requests} filters={filters} onChange={setFilters} onReset={resetFilters} shown={shown.length} />
              {shown.length === 0 ? (
                <EmptyState title="Aucune demande ne correspond à ces critères.">Modifiez ou effacez les filtres pour retrouver vos demandes.</EmptyState>
              ) : (
                <ul className="space-y-4">
                  {shown.map((request) => <li key={request.id}><RequestCard request={request} /></li>)}
                </ul>
              )}
            </div>
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
        <p className="text-sm text-slate-600">{REQUEST_TYPE_LABELS[request.type]}{request.category && request.category !== "other" ? ` · ${CATEGORY_LABELS[request.category]}` : ""} · {request.reference}{request.messageCount ? ` · ${request.messageCount} message${request.messageCount > 1 ? "s" : ""}` : ""} · envoyée le <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time></p>
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
  const query = useGetMyRequestQuery(reference, polling(REQUESTS_POLLING_MS))
  useLogoutOnUnauthorized(query.error)
  const failure = toQueryError(query.error)
  const request = query.data
  useReadRequestNotifications(reference, Boolean(request))
  return (
    <div className="space-y-6">
      <Link href="/espace/demandes" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
        <ArrowLeft className="size-4" aria-hidden="true" /> Toutes mes demandes
      </Link>
      {query.isLoading ? (
        <LoadingState label="Chargement de la demande…" />
      ) : failure && !request ? (
        failure.status === 401 ? null : failure.status === 404
          ? <EmptyState title="Cette demande est introuvable dans votre espace.">Vérifiez le numéro de suivi ou revenez à la liste de vos demandes.</EmptyState>
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
            {request.isPublic && (
              <p className="mt-4 rounded-xl bg-teal-50 p-3 text-slate-900">
                Signalement visible des autres habitants · <span className="font-semibold">{request.supportCount ?? 0} soutien{(request.supportCount ?? 0) > 1 ? "s" : ""}</span>
              </p>
            )}
            {request.medicalEmergency && (
              <p className="mt-4 rounded-xl border-2 border-red-700 bg-red-50 p-3 text-red-950">
                Urgence médicale signalée{request.emergencyHandledAt ? <> — prise en charge par un agent le <time dateTime={request.emergencyHandledAt}>{formatDateTime(request.emergencyHandledAt)}</time></> : ""}. En cas de danger, appelez le <a href="tel:15" className="font-semibold underline"><span dir="ltr">15</span></a> ou le <a href="tel:112" className="font-semibold underline"><span dir="ltr">112</span></a>.
              </p>
            )}
            <h3 className="mt-6 font-semibold text-slate-950">Votre message</h3>
            <p className="mt-2 whitespace-pre-wrap text-slate-800">{request.description}</p>
            {/* F76 : une demande close propose de donner son avis sur le service concerné. */}
            {request.serviceId && (request.status === "resolved" || request.status === "rejected") && (
              <p className="mt-5">
                <Link href={`/espace/avis?service=${encodeURIComponent(request.serviceId)}&demande=${encodeURIComponent(request.reference)}` as Route} className="inline-flex rounded-xl border border-teal-700 px-4 py-2 font-medium text-teal-800 hover:bg-teal-50">
                  Donner mon avis sur ce service
                </Link>
              </p>
            )}
          </article>
          <section aria-labelledby="titre-etapes" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 id="titre-etapes" className="text-lg font-semibold">Étapes du traitement</h2>
            <div className="mt-5" aria-live="polite"><RequestTimeline steps={request.steps} /></div>
            <Link href={`/espace/demandes/accuse?ref=${encodeURIComponent(request.reference)}` as Route} className="mt-6 inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
              <FileText className="size-4" aria-hidden="true" /> Accusé de réception
            </Link>
          </section>
          <div className="lg:col-span-2"><RequestConversation reference={request.reference} /></div>
        </div>
      ) : null}
    </div>
  )
}
