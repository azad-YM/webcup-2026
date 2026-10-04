"use client"
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Send } from "@boilerplate/shared-ui/components/icon"
import { ContextualTip, FormProtection, useProtectedSubmit } from "@boilerplate/shared-ui/components/a11y"
import { siteEnv } from "@/config/env"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { FormAnnouncement, SelectField, TextAreaField, TextField } from "@/modules/shared/ui/components/form-field"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { StatusBadge } from "../components/request-status"
import { useSubmitRequestMutation } from "../../core/application/rtk-api/service-requests"
import { useListDistrictsQuery } from "../../core/application/rtk-api/citizen"
import { MedicalEmergencyNotice, NotAnEmergencyServiceNote } from "../components/medical-emergency-notice"
import {
  formatDateTime,
  isRequestType,
  LIMITS,
  looksLikeMedicalEmergency,
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

/** `?service=` : identifiant du service visé (depuis sa fiche) ; l'API refuse si ce service est désactivé (F63, 409). */
const SERVICE_ID = /^[a-z0-9][a-z0-9-]{0,79}$/

/**
 * Envoi d'une demande (D04, F25) puis confirmation immédiate avec la référence (D16).
 * `serviceNotice` : état du service visé (F64), fourni par le module `public` via la page (slot).
 */
export function NewServiceRequestPage({ serviceNotice }: { serviceNotice?: ReactNode } = {}) {
  const access = useCitizenAccess()
  const params = useSearchParams()
  const typeParam = params.get("type")
  const serviceParam = params.get("service")
  const serviceId = serviceParam && SERVICE_ID.test(serviceParam) ? serviceParam : null
  const initialType: RequestType = isRequestType(typeParam) ? typeParam : "contact"
  const [sent, setSent] = useState<ServiceRequest | null>(null)
  const [alreadySent, setAlreadySent] = useState(false)
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
          <Confirmation request={sent} duplicate={alreadySent} onAnother={() => setSent(null)} />
        ) : (
          <>
          {serviceNotice}
          <ContextualTip hintId="astuce-premiere-demande" title="Pour une réponse plus rapide" className="mb-6">
            Écrivez simplement ce qui se passe et, pour un problème, l’endroit exact. Vous pourrez suivre la réponse dans « Mes demandes ».
          </ContextualTip>
          <section aria-label="Formulaire de demande" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <RequestForm key={`${initialType}-${serviceId ?? "aucun"}`} initialType={initialType} serviceId={serviceId} onSent={(request, duplicate) => { setAlreadySent(duplicate); setSent(request) }} />
          </section>
          </>
        )}
      </PageBody>
    </>
  )
}

function RequestForm({ initialType, serviceId, onSent }: { initialType: RequestType; serviceId: string | null; onSent: (request: ServiceRequest, duplicate: boolean) => void }) {
  const [draft, setDraft] = useState<RequestDraft>({ type: initialType, subject: "", description: "", location: "", serviceId, district: "", medicalEmergency: false })
  const districts = useListDistrictsQuery()
  // F86 : repérage local à la saisie ; le message s'affiche tout de suite, sans bloquer l'envoi.
  const detected = looksLikeMedicalEmergency(`${draft.subject} ${draft.description}`)
  const emergency = Boolean(draft.medicalEmergency) || detected
  const [errors, setErrors] = useState<DraftErrors>({})
  const [submit, { isLoading, error }] = useSubmitRequestMutation()
  const sending = useRef(false)
  // L25 (F81, F82) : protection contre les robots et les envois multiples.
  const guard = useProtectedSubmit({ apiBaseUrl: siteEnv.apiBaseUrl, form: "demande" })
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
      const request = await guard.submit(draft, () => submit(draft).unwrap())
      if (request) onSent(request, guard.wasReplay())
    } catch {
      /* L'erreur est annoncée sous le formulaire. */
    } finally {
      sending.current = false
    }
  }

  const report = draft.type === "report"
  return (
    <form onSubmit={send} noValidate className="space-y-6" data-brouillon="demande">
      <div className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-white p-4">
        <input
          id="demande-urgence"
          type="checkbox"
          className="mt-1 size-5 accent-red-700"
          checked={Boolean(draft.medicalEmergency)}
          onChange={(event) => setDraft((current) => ({ ...current, medicalEmergency: event.target.checked, isPublic: event.target.checked ? false : current.isPublic }))}
          aria-describedby="demande-urgence-aide"
        />
        <div>
          <label htmlFor="demande-urgence" className="font-medium text-slate-950">C’est une urgence médicale</label>
          <p id="demande-urgence-aide" className="text-sm text-slate-700">Votre demande sera traitée en priorité, mais appelez d’abord le 15 ou le 112.</p>
        </div>
      </div>
      {emergency && <MedicalEmergencyNotice detected={detected && !draft.medicalEmergency} />}
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
      <SelectField
        id="demande-district"
        label="Quartier concerné"
        optional
        placeholder={districts.isError ? "Liste des quartiers indisponible" : "Celui de mon profil"}
        hint="Aide les agents à regrouper les demandes d’un même secteur."
        options={(districts.data ?? []).map((district) => ({ value: district, label: district }))}
        value={draft.district ?? ""}
        onChange={(event) => update("district", event.target.value)}
      />
      {report && !draft.medicalEmergency && (
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
      <NotAnEmergencyServiceNote />
      <FormProtection guard={guard} />
      <FormAnnouncement tone="error">{guard.refusal ?? (failure && failure.status !== 401 ? failure.data : null)}</FormAnnouncement>
      <button
        type="submit"
        disabled={isLoading || guard.submitting}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="size-5" aria-hidden="true" /> {isLoading ? "Envoi en cours…" : "Envoyer ma demande"}
      </button>
    </form>
  )
}

function Confirmation({ request, duplicate = false, onAnother }: { request: ServiceRequest; duplicate?: boolean; onAnother: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => titleRef.current?.focus(), [])
  return (
    <section aria-labelledby="titre-confirmation" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
      <CheckCircle2 className="size-10 text-emerald-700" aria-hidden="true" />
      <h2 id="titre-confirmation" ref={titleRef} tabIndex={-1} className="mt-4 text-2xl font-semibold text-slate-950 focus:outline-none">
        {duplicate ? `Votre demande a déjà été envoyée (référence ${request.reference})` : "Votre demande a bien été envoyée"}
      </h2>
      {duplicate ? <p className="mt-2 text-slate-800">Le second envoi n’a pas créé de nouvelle demande.</p> : null}
      <p className="mt-3 text-slate-800">La mairie l’a reçue le <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>. Notez son <Link href={"/aide/glossaire#numero-de-suivi" as Route} className="underline underline-offset-4">numéro de suivi</Link> :</p>
      <p className="mt-3 inline-block rounded-xl border border-emerald-300 bg-white px-4 py-2 font-mono text-2xl font-semibold tracking-wide text-slate-950">{request.reference}</p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-600">Objet</dt><dd className="font-medium text-slate-900">{request.subject}</dd></div>
        <div><dt className="text-sm text-slate-600">État</dt><dd className="mt-1"><StatusBadge status={request.status} /></dd></div>
      </dl>
      {request.medicalEmergency && (
        <div className="mt-5"><MedicalEmergencyNotice detected={false} /></div>
      )}
      <p className="mt-5 text-slate-800">
        {request.medicalEmergency
          ? "Votre demande a été signalée comme urgence médicale : les agents de la mairie sont alertés immédiatement. Elle ne remplace pas les secours."
          : "Vous suivrez chaque étape du traitement dans « Mes demandes »."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/espace/demandes?ref=${encodeURIComponent(request.reference)}` as Route} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Suivre ma demande</Link>
        <Link href={`/espace/demandes/accuse?ref=${encodeURIComponent(request.reference)}` as Route} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">Accusé de réception (imprimer ou télécharger)</Link>
        <button type="button" onClick={onAnother} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">Envoyer une autre demande</button>
      </div>
    </section>
  )
}
