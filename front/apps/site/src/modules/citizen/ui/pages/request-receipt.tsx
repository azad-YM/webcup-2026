"use client"
import { useEffect } from "react"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, FileDown, Printer } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { EmptyState, ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { downloadTextFile } from "@/modules/shared/ui/download"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { useGetMyRequestReceiptQuery } from "../../core/application/rtk-api/service-requests"
import { formatDateTime, REQUEST_TYPE_LABELS, type RequestReceipt } from "../../core/domain/service-request"

/** Texte du fichier téléchargé : mêmes informations que la page, sans la description de la demande. */
function receiptText(receipt: RequestReceipt, origin: string): string {
  return [
    "MAIRIE DE NOVA TERRA — ACCUSÉ DE RÉCEPTION",
    "",
    `Référence : ${receipt.reference}`,
    `Reçue le : ${formatDateTime(receipt.submittedAt)}`,
    `Type : ${REQUEST_TYPE_LABELS[receipt.type]}`,
    `Service : ${receipt.serviceName ?? "Mairie (aucun service précisé)"}`,
    `Objet : ${receipt.subject}`,
    `Empreinte de vérification : ${receipt.fingerprint}`,
    "",
    ...(receipt.medicalEmergency ? ["URGENCE MÉDICALE : cette plateforme n’est pas un service d’urgence. Appelez le 15 ou le 112.", ""] : []),
    "Vérifier cet accusé (sans en voir le contenu) :",
    `${origin}/verifier-accuse?ref=${encodeURIComponent(receipt.reference)}`,
    ""
  ].join("\r\n")
}

/** F83 : accusé de réception imprimable et téléchargeable (`?ref=`). */
export function RequestReceiptPage() {
  const access = useCitizenAccess()
  const reference = useSearchParams().get("ref") ?? ""
  return (
    <>
      <div data-print="hide">
        <PageHeader
          trail={[{ label: "Mon espace", href: "/espace" }, { label: "Mes demandes", href: "/espace/demandes" }, { label: "Accusé de réception" }]}
          title="Accusé de réception"
          lead="À conserver comme preuve de l’envoi de votre demande : imprimez-le, enregistrez-le en PDF ou téléchargez-le."
        />
      </div>
      <PageBody narrow>
        {!access.profile
          ? <CitizenAccessState access={access} returnTo="/espace/demandes" />
          : reference ? <Receipt reference={reference} /> : <EmptyState title="Aucune demande indiquée.">Ouvrez l’accusé depuis « Mes demandes ».</EmptyState>}
      </PageBody>
    </>
  )
}

function Receipt({ reference }: { reference: string }) {
  const query = useGetMyRequestReceiptQuery(reference)
  const { logout } = useSession()
  const failure = toQueryError(query.error)
  useEffect(() => {
    if (failure?.status === 401) logout()
  }, [failure?.status, logout])
  const receipt = query.data
  if (query.isLoading) return <LoadingState label="Préparation de l’accusé…" />
  if (!receipt) {
    if (failure?.status === 404) return <EmptyState title="Cette demande est introuvable dans votre espace.">Vérifiez le numéro de suivi.</EmptyState>
    return failure && failure.status !== 401 ? <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} /> : null
  }
  return (
    <div className="space-y-6">
      <div data-print="hide" className="flex flex-wrap gap-3">
        <Link href={`/espace/demandes?ref=${encodeURIComponent(receipt.reference)}` as Route} className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
          <ArrowLeft className="size-4" aria-hidden="true" /> Revenir à la demande
        </Link>
      </div>
      <div data-print="hide" className="flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">
          <Printer className="size-5" aria-hidden="true" /> Imprimer ou enregistrer en PDF
        </button>
        <button type="button" onClick={() => downloadTextFile(`accuse-${receipt.reference}.txt`, receiptText(receipt, window.location.origin), "text/plain;charset=utf-8")} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">
          <FileDown className="size-5" aria-hidden="true" /> Télécharger (texte)
        </button>
      </div>
      <article aria-labelledby="titre-accuse" className="rounded-3xl border-2 border-slate-300 bg-white p-6 print:border-0 print:p-0 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Mairie de Nova Terra</p>
        <h2 id="titre-accuse" className="mt-1 text-2xl font-semibold text-slate-950">Accusé de réception</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-600">Référence</dt><dd className="font-mono text-xl font-semibold">{receipt.reference}</dd></div>
          <div><dt className="text-sm text-slate-600">Reçue le</dt><dd className="font-medium"><time dateTime={receipt.submittedAt}>{formatDateTime(receipt.submittedAt)}</time></dd></div>
          <div><dt className="text-sm text-slate-600">Type</dt><dd className="font-medium">{REQUEST_TYPE_LABELS[receipt.type]}</dd></div>
          <div><dt className="text-sm text-slate-600">Service</dt><dd className="font-medium">{receipt.serviceName ?? "Mairie (aucun service précisé)"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-sm text-slate-600">Objet</dt><dd className="font-medium">{receipt.subject}</dd></div>
          <div className="sm:col-span-2"><dt className="text-sm text-slate-600">Empreinte de vérification</dt><dd className="font-mono text-lg font-semibold tracking-widest" dir="ltr">{receipt.fingerprint}</dd></div>
        </dl>
        {receipt.medicalEmergency && (
          <p className="mt-6 rounded-xl border-2 border-red-700 bg-red-50 p-3 font-medium text-red-950">
            Urgence médicale : cette plateforme n’est pas un service d’urgence. Appelez le <span dir="ltr">15</span> ou le <span dir="ltr">112</span>.
          </p>
        )}
        <p className="mt-6 text-sm text-slate-700">
          Toute personne peut vérifier l’authenticité de cet accusé, sans voir le contenu de la demande, sur la page « Vérifier un accusé » du site avec la référence et l’empreinte.
        </p>
      </article>
      <p data-print="hide" className="text-sm text-slate-600">
        Si votre compte a une adresse e-mail, cet accusé vous a aussi été envoyé par e-mail.{" "}
        <Link href={`/verifier-accuse?ref=${encodeURIComponent(receipt.reference)}` as Route} className="underline underline-offset-4">Vérifier un accusé</Link>
      </p>
    </div>
  )
}
