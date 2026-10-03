"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Send } from "@boilerplate/shared-ui/components/icon"
import { ContextualTip } from "@boilerplate/shared-ui/components/a11y"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { FormAnnouncement, SelectField, TextAreaField, TextField } from "@/modules/shared/ui/components/form-field"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { StatusBadge } from "../components/request-status"
import { useSubmitRequestMutation } from "../../core/application/rtk-api/service-requests"
import {
  formatDateTime,
  isRequestType,
  LIMITS,
  REQUEST_TYPE_LABELS,
  validateDraft,
  type DraftErrors,
  type RequestDraft,
  type RequestType,
  type ServiceRequest
} from "../../core/domain/service-request"

const TITLES: Record<RequestType, { title: string; lead: string }> = {
  contact: { title: "Contacter la mairie", lead: "Posez une question ou adressez un message aux services municipaux. Vous recevrez un numéro de suivi pour suivre votre demande." },
  report: { title: "Signaler un problème", lead: "Voirie, éclairage, propreté, inondation… Décrivez le problème et indiquez où il se trouve." }
}

/** Envoi d'une demande (D04, F25) puis confirmation immédiate avec la référence (D16). */
export function NewServiceRequestPage() {
  const access = useCitizenAccess()
  const typeParam = useSearchParams().get("type")
  const initialType: RequestType = isRequestType(typeParam) ? typeParam : "contact"
  const [sent, setSent] = useState<ServiceRequest | null>(null)
  const heading = sent ? "Demande envoyée" : TITLES[initialType].title
  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace", href: "/espace" }, { label: "Mes demandes", href: "/espace/demandes" }, { label: heading }]}
        title={heading}
        lead={sent ? undefined : TITLES[initialType].lead}
      />
      <PageBody narrow>
        {!access.profile ? (
          <CitizenAccessState access={access} returnTo="/espace/demandes/nouvelle" />
        ) : sent ? (
          <Confirmation request={sent} onAnother={() => setSent(null)} />
        ) : (
          <>
          <ContextualTip hintId="astuce-premiere-demande" title="Pour une réponse plus rapide" className="mb-6">
            Écrivez simplement ce qui se passe et, pour un problème, l’endroit exact. Vous pourrez suivre la réponse dans « Mes demandes ».
          </ContextualTip>
          <section aria-label="Formulaire de demande" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <RequestForm key={initialType} initialType={initialType} onSent={setSent} />
          </section>
          </>
        )}
      </PageBody>
    </>
  )
}

function RequestForm({ initialType, onSent }: { initialType: RequestType; onSent: (request: ServiceRequest) => void }) {
  const [draft, setDraft] = useState<RequestDraft>({ type: initialType, subject: "", description: "", location: "", serviceId: null })
  const [errors, setErrors] = useState<DraftErrors>({})
  const [submit, { isLoading, error }] = useSubmitRequestMutation()
  const sending = useRef(false)
  const { logout } = useSession()
  const failure = toQueryError(error)
  useEffect(() => {
    if (failure?.status === 401) logout()
  }, [failure?.status, logout])

  const update = (field: keyof RequestDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }))

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (sending.current) return
    const found = validateDraft(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(`demande-${Object.keys(found)[0]}`)?.focus()
      return
    }
    sending.current = true
    try {
      onSent(await submit(draft).unwrap())
    } catch {
      /* L'erreur est annoncée sous le formulaire. */
    } finally {
      sending.current = false
    }
  }

  const report = draft.type === "report"
  return (
    <form onSubmit={send} noValidate className="space-y-6">
      <SelectField
        id="demande-type"
        label="Type de demande"
        value={draft.type}
        onChange={(event) => update("type", event.target.value)}
        options={(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((value) => ({ value, label: value === "contact" ? "Contacter la mairie" : "Signaler un problème" }))}
      />
      <TextField
        id="demande-subject"
        label="Objet"
        hint={report ? "Par exemple : « Lampadaire éteint rue des Palmiers »." : "Résumez votre demande en une phrase."}
        value={draft.subject}
        maxLength={LIMITS.subject}
        required
        error={errors.subject}
        onChange={(event) => update("subject", event.target.value)}
      />
      <TextAreaField
        id="demande-description"
        label="Description"
        rows={6}
        value={draft.description}
        maxLength={LIMITS.description}
        required
        error={errors.description}
        onChange={(event) => update("description", event.target.value)}
      />
      <TextField
        id="demande-location"
        label="Lieu"
        optional={!report}
        hint={report ? "Adresse, rue, quartier ou repère visible." : undefined}
        value={draft.location}
        maxLength={LIMITS.location}
        required={report}
        autoComplete="street-address"
        error={errors.location}
        onChange={(event) => update("location", event.target.value)}
      />
      {report && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            id="demande-publique"
            type="checkbox"
            className="mt-1 size-5 accent-teal-700"
            checked={Boolean(draft.isPublic)}
            onChange={(event) => setDraft((current) => ({ ...current, isPublic: event.target.checked }))}
            aria-describedby="demande-publique-aide"
          />
          <div>
            <label htmlFor="demande-publique" className="font-medium text-slate-950">Rendre ce signalement visible des autres habitants</label>
            <p id="demande-publique-aide" className="text-sm text-slate-700">Seuls l’objet, le lieu et l’état seront affichés, jamais votre nom ni votre message. D’autres habitants pourront le soutenir. Facultatif.</p>
          </div>
        </div>
      )}
      <FormAnnouncement tone="error">{failure && failure.status !== 401 ? failure.data : null}</FormAnnouncement>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="size-5" aria-hidden="true" /> {isLoading ? "Envoi en cours…" : "Envoyer ma demande"}
      </button>
    </form>
  )
}

function Confirmation({ request, onAnother }: { request: ServiceRequest; onAnother: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => titleRef.current?.focus(), [])
  return (
    <section aria-labelledby="titre-confirmation" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
      <CheckCircle2 className="size-10 text-emerald-700" aria-hidden="true" />
      <h2 id="titre-confirmation" ref={titleRef} tabIndex={-1} className="mt-4 text-2xl font-semibold text-slate-950 focus:outline-none">
        Votre demande a bien été envoyée
      </h2>
      <p className="mt-3 text-slate-800">La mairie l’a reçue le <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>. Notez son <Link href={"/aide/glossaire#numero-de-suivi" as Route} className="underline underline-offset-4">numéro de suivi</Link> :</p>
      <p className="mt-3 inline-block rounded-xl border border-emerald-300 bg-white px-4 py-2 font-mono text-2xl font-semibold tracking-wide text-slate-950">{request.reference}</p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-600">Objet</dt><dd className="font-medium text-slate-900">{request.subject}</dd></div>
        <div><dt className="text-sm text-slate-600">État</dt><dd className="mt-1"><StatusBadge status={request.status} /></dd></div>
      </dl>
      <p className="mt-5 text-slate-800">Vous suivrez chaque étape du traitement dans « Mes demandes ».</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/espace/demandes?ref=${encodeURIComponent(request.reference)}` as Route} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Suivre ma demande</Link>
        <button type="button" onClick={onAnother} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">Envoyer une autre demande</button>
      </div>
    </section>
  )
}
