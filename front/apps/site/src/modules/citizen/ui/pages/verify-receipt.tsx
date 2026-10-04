"use client"
import { useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { ShieldCheck } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { useVerifyRequestReceiptMutation } from "../../core/application/rtk-api/service-requests"
import { formatDateTime } from "../../core/domain/service-request"

/**
 * F83 : vérification publique d'un accusé de réception (référence + empreinte). La réponse dit seulement si
 * l'accusé est authentique et sa date de réception : ni l'objet ni l'auteur ne sont révélés.
 */
export function VerifyReceiptPage() {
  const params = useSearchParams()
  const [reference, setReference] = useState(params.get("ref") ?? "")
  const [fingerprint, setFingerprint] = useState("")
  const [verify, { data, isLoading, error, reset }] = useVerifyRequestReceiptMutation()
  const failure = toQueryError(error)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) return
    reset()
    await verify({ reference, fingerprint })
  }

  return (
    <>
      <PageHeader
        trail={[{ label: "Vérifier un accusé de réception" }]}
        title="Vérifier un accusé de réception"
        lead="Un habitant vous présente un accusé de réception de la mairie ? Vérifiez qu’il est authentique avec sa référence et son empreinte. Le contenu de la demande n’est jamais affiché."
      />
      <PageBody narrow>
        <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <TextField id="accuse-reference" label="Référence" hint="Par exemple : NT-2026-0042." value={reference} maxLength={30} required onChange={(event) => { setReference(event.target.value); reset() }} />
          <TextField id="accuse-empreinte" label="Empreinte de vérification" hint="Dix caractères, par exemple : 7K2QF-9XM4A." value={fingerprint} maxLength={30} required onChange={(event) => { setFingerprint(event.target.value); reset() }} />
          <FormAnnouncement tone="error">{failure ? failure.data : null}</FormAnnouncement>
          <div aria-live="polite">
            {data && (data.valid ? (
              <p className="rounded-xl border-2 border-emerald-700 bg-emerald-50 p-4 font-medium text-emerald-950">
                Accusé authentique : la demande {data.reference} a bien été reçue par la mairie le {data.submittedAt ? <time dateTime={data.submittedAt}>{formatDateTime(data.submittedAt)}</time> : "—"}.
              </p>
            ) : (
              <p className="rounded-xl border-2 border-dashed border-red-700 bg-red-50 p-4 font-medium text-red-950">
                Accusé non reconnu : la référence ou l’empreinte ne correspond pas. Vérifiez la saisie ; en cas de doute, contactez la mairie.
              </p>
            ))}
          </div>
          <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-70">
            <ShieldCheck className="size-5" aria-hidden="true" /> {isLoading ? "Vérification…" : "Vérifier"}
          </button>
        </form>
      </PageBody>
    </>
  )
}
