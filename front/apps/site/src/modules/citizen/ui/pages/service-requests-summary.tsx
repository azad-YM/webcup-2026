"use client"
import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, FileDown, Printer } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { downloadTextFile, todayStamp } from "@/modules/shared/ui/download"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { StatusBadge } from "../components/request-status"
import { useListMyRequestsQuery } from "../../core/application/rtk-api/service-requests"
import { formatDateTime, REQUEST_TYPE_LABELS, STATUS_LABELS, type ServiceRequest } from "../../core/domain/service-request"
import { requestsToCsv } from "../../core/domain/service-request-summary"

/**
 * F56 — récapitulatif de « Mes demandes » : page lisible et imprimable (numéros de suivi, état, dates, étapes)
 * et téléchargement CSV. Construit à partir de `GET /api/citizen/requests` : aucun endpoint dédié.
 */
export function ServiceRequestsSummaryPage() {
  const access = useCitizenAccess()
  return (
    <>
      <div data-print="hide">
        <PageHeader
          trail={[{ label: "Mon espace", href: "/espace" }, { label: "Mes demandes", href: "/espace/demandes" }, { label: "Récapitulatif" }]}
          title="Récapitulatif de mes demandes"
          lead="Toutes vos demandes sur une page : à imprimer, à enregistrer en PDF depuis la fenêtre d’impression, ou à télécharger pour un tableur."
        />
      </div>
      <PageBody>
        {!access.profile
          ? <CitizenAccessState access={access} returnTo="/espace/demandes/recapitulatif" />
          : <Summary name={[access.profile.firstName, access.profile.lastName].filter(Boolean).join(" ") || null} />}
      </PageBody>
    </>
  )
}

function Summary({ name }: { name: string | null }) {
  const query = useListMyRequestsQuery()
  const { logout } = useSession()
  const failure = toQueryError(query.error)
  useEffect(() => { if (failure?.status === 401) logout() }, [failure?.status, logout])
  const requests = query.data ?? []
  if (query.isLoading) return <LoadingState label="Préparation du récapitulatif…"><SkeletonCards count={2} /></LoadingState>
  if (failure && !query.data) return failure.status === 401 ? null : <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
  const generatedAt = formatDateTime(new Date().toISOString())
  const open = requests.filter((request) => request.status !== "resolved" && request.status !== "rejected").length
  return (
    <div className="space-y-8">
      <div data-print="hide" className="flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} disabled={requests.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          <Printer className="size-5" aria-hidden="true" /> Imprimer ou enregistrer en PDF
        </button>
        <button type="button" onClick={() => downloadTextFile(`nova-terra-mes-demandes-${todayStamp()}.csv`, requestsToCsv(requests), "text/csv;charset=utf-8")} disabled={requests.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50 disabled:opacity-60">
          <FileDown className="size-5" aria-hidden="true" /> Télécharger le tableau (CSV)
        </button>
        <Link href="/espace/demandes" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium text-teal-800 underline underline-offset-4">
          <ArrowLeft className="size-4" aria-hidden="true" /> Retour à mes demandes
        </Link>
      </div>
      <p data-print="hide" className="text-sm text-slate-600">Le fichier CSV s’ouvre avec un tableur (LibreOffice, Excel…) : une ligne par demande, colonnes séparées par des points-virgules.</p>

      <article aria-labelledby="titre-recapitulatif" className="rounded-3xl border border-slate-200 bg-white p-6 print:border-0 print:p-0 sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-800">Mairie de Nova Terra</p>
          <h2 id="titre-recapitulatif" className="mt-1 text-2xl font-semibold">{name ? `Récapitulatif des demandes de ${name}` : "Récapitulatif de mes demandes"}</h2>
          <p className="mt-2 text-slate-700">
            Établi le {generatedAt} · {requests.length} demande{requests.length > 1 ? "s" : ""}, dont {open} en cours.
          </p>
        </header>
        {requests.length === 0 ? (
          <div className="mt-6"><EmptyState title="Vous n’avez encore envoyé aucune demande." /></div>
        ) : (
          <>
            <table className="mt-6 w-full border-collapse text-left text-sm">
              <caption className="sr-only">Vue d’ensemble de vos demandes</caption>
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th scope="col" className="py-2 pe-3">Numéro de suivi</th>
                  <th scope="col" className="py-2 pe-3">Objet</th>
                  <th scope="col" className="py-2 pe-3">État</th>
                  <th scope="col" className="py-2 pe-3">Envoyée le</th>
                  <th scope="col" className="py-2">Mise à jour</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-200 align-top" data-print="avoid-break">
                    <th scope="row" className="py-2 pe-3 font-semibold" dir="ltr">{request.reference}</th>
                    <td className="py-2 pe-3">{request.subject}</td>
                    <td className="py-2 pe-3">{STATUS_LABELS[request.status]}</td>
                    <td className="py-2 pe-3">{formatDateTime(request.createdAt)}</td>
                    <td className="py-2">{formatDateTime(request.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="mt-10 text-xl font-semibold">Détail et étapes de chaque demande</h3>
            <ol className="mt-4 space-y-6">
              {requests.map((request) => <SummaryItem key={request.id} request={request} />)}
            </ol>
          </>
        )}
        <footer className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-600">
          Document généré depuis votre espace citoyen. Pour toute question, citez le numéro de suivi de la demande concernée.
        </footer>
      </article>
    </div>
  )
}

function SummaryItem({ request }: { request: ServiceRequest }) {
  return (
    <li data-print="avoid-break" className="rounded-2xl border border-slate-200 p-5 print:rounded-none print:border-x-0 print:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">{REQUEST_TYPE_LABELS[request.type]} · <span dir="ltr">{request.reference}</span></p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{request.subject}</p>
          {request.location && <p className="text-slate-700">Lieu : {request.location}</p>}
        </div>
        <StatusBadge status={request.status} />
      </div>
      <ol className="mt-4 space-y-2 border-s-2 border-teal-200 ps-4">
        {request.steps.map((step) => (
          <li key={`${step.status}-${step.at}`}>
            <p><span className="font-medium">{STATUS_LABELS[step.status]}</span> — <time dateTime={step.at}>{formatDateTime(step.at)}</time></p>
            {step.comment && <p className="text-slate-700">Message de la mairie : {step.comment}</p>}
          </li>
        ))}
      </ol>
    </li>
  )
}
