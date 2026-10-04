"use client"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { FileDown, Printer, ShieldCheck } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { downloadTextFile, todayStamp } from "@/modules/shared/ui/download"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { useExportMyDataMutation, useSendIdentityCodeMutation } from "../../core/application/rtk-api/personal-data"
import { FIELD_LABELS, HIDDEN_FIELDS, type PersonalDataExport, type PersonalDataSection } from "../../core/domain/personal-data"
import { formatDateTime } from "../../core/domain/service-request"

const primary = "inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
const secondary = "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50 disabled:opacity-60"

/**
 * F55 — « Mes données » : après confirmation d’identité, tout ce que la ville sait de vous, regroupé par
 * rubrique avec son explication, imprimable, et téléchargeable en JSON structuré.
 */
export function PersonalDataPage() {
  const access = useCitizenAccess()
  const [result, setResult] = useState<PersonalDataExport | null>(null)
  return (
    <>
      <div data-print="hide">
        <PageHeader
          trail={[{ label: "Mon espace", href: "/espace" }, { label: "Mes données" }]}
          title="Mes données"
          lead="Consultez et téléchargez les informations personnelles que la ville de Nova Terra conserve à votre sujet."
        />
      </div>
      <PageBody narrow>
        {!access.profile ? <CitizenAccessState access={access} returnTo="/espace/mes-donnees" />
          : result ? <PersonalDataView data={result} onClose={() => setResult(null)} />
          : <ConfirmIdentity onExported={setResult} />}
      </PageBody>
    </>
  )
}

/** Confirmation avant l’export : mot de passe, ou code reçu par e-mail. */
function ConfirmIdentity({ onExported }: { onExported: (data: PersonalDataExport) => void }) {
  const [exportData, { isLoading, error }] = useExportMyDataMutation()
  const [sendCode, codeState] = useSendIdentityCodeMutation()
  const { logout } = useSession()
  const [method, setMethod] = useState<"password" | "code">("password")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const failure = toQueryError(error)
  const codeFailure = toQueryError(codeState.error)
  useEffect(() => { if (failure?.status === 401 || codeFailure?.status === 401) logout() }, [failure?.status, codeFailure?.status, logout])
  const challenge = codeState.data

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      const data = method === "password"
        ? await exportData({ password }).unwrap()
        : await exportData({ challengeId: challenge?.challengeId ?? "", code }).unwrap()
      onExported(data)
    } catch { setPassword(""); setCode("") }
  }

  return (
    <section aria-labelledby="titre-confirmation" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <ShieldCheck className="size-8 text-teal-700" aria-hidden="true" />
      <h2 id="titre-confirmation" className="mt-4 text-xl font-semibold">Confirmez qu’il s’agit bien de vous</h2>
      <p className="mt-2 text-slate-700">
        Vos données sont personnelles : avant de les afficher, nous vérifions votre identité. Vous verrez ensuite votre compte,
        votre profil, vos préférences, vos demandes, rendez-vous, notifications, votre participation, vos appareils et vos
        connexions récentes, avec l’explication de chaque rubrique.
      </p>
      <fieldset className="mt-6">
        <legend className="font-medium text-slate-900">Comment voulez-vous confirmer ?</legend>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-3"><input type="radio" name="methode" checked={method === "password"} onChange={() => setMethod("password")} className="size-5" /> Avec mon mot de passe</label>
          <label className="flex items-center gap-3"><input type="radio" name="methode" checked={method === "code"} onChange={() => setMethod("code")} className="size-5" /> Avec un code reçu par e-mail (si vous vous connectez sans mot de passe)</label>
        </div>
      </fieldset>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-5" noValidate>
        {method === "password" ? (
          <TextField id="export-mot-de-passe" label="Mot de passe" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        ) : !challenge ? (
          <div className="space-y-3">
            <button type="button" onClick={() => void sendCode()} disabled={codeState.isLoading} className={secondary}>
              {codeState.isLoading ? "Envoi…" : "Recevoir un code par e-mail"}
            </button>
            <FormAnnouncement tone="error">{codeFailure?.data}</FormAnnouncement>
          </div>
        ) : (
          <TextField id="export-code" label={`Code reçu à ${challenge.emailHint}`} hint="6 chiffres, valable 10 minutes. Pensez aux courriers indésirables." inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
        )}
        <FormAnnouncement tone="error">{failure?.data}</FormAnnouncement>
        <button type="submit" disabled={isLoading || (method === "password" ? !password : !challenge || code.length !== 6)} className={primary}>
          {isLoading ? "Préparation…" : "Afficher mes données"}
        </button>
      </form>
    </section>
  )
}

function PersonalDataView({ data, onClose }: { data: PersonalDataExport; onClose: () => void }) {
  return (
    <div className="space-y-8">
      <div data-print="hide" className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => downloadTextFile(`nova-terra-mes-donnees-${todayStamp()}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8")} className={primary}>
            <FileDown className="size-5" aria-hidden="true" /> Télécharger (JSON)
          </button>
          <button type="button" onClick={() => window.print()} className={secondary}>
            <Printer className="size-5" aria-hidden="true" /> Imprimer ou enregistrer en PDF
          </button>
          <button type="button" onClick={onClose} className="rounded-xl px-5 py-3 font-medium text-teal-800 underline underline-offset-4">Masquer mes données</button>
        </div>
        <p className="text-sm text-slate-600">
          Le fichier JSON reprend les mêmes rubriques dans un format structuré, lisible par un autre service ou un tableur.
          Gardez-le en lieu sûr : il contient vos informations personnelles.
        </p>
      </div>
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-teal-800">{data.controller}</p>
        <h2 className="mt-1 text-2xl font-semibold">Vos données personnelles</h2>
        <p className="mt-1 text-slate-700">État au {formatDateTime(data.generatedAt)}.</p>
      </header>
      <nav data-print="hide" aria-label="Rubriques" className="rounded-2xl bg-slate-50 p-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {data.sections.map((section) => <li key={section.key}><a href={`#rubrique-${section.key}`} className="font-medium text-teal-800 underline underline-offset-4">{section.title}</a></li>)}
        </ul>
      </nav>
      {data.sections.map((section) => <SectionView key={section.key} section={section} />)}
    </div>
  )
}

function SectionView({ section }: { section: PersonalDataSection }) {
  return (
    <section id={`rubrique-${section.key}`} aria-labelledby={`titre-${section.key}`} className="rounded-3xl border border-slate-200 bg-white p-6 print:rounded-none print:border-x-0 print:border-b-0 sm:p-8">
      <h3 id={`titre-${section.key}`} className="text-xl font-semibold">{section.title}</h3>
      <p className="mt-2 text-slate-700">{section.explanation}</p>
      <div className="mt-4"><DataValue value={section.data} /></div>
    </section>
  )
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const VALUE_LABELS: Record<string, string> = { password: "Mot de passe", link: "Lien reçu par e-mail", active: "Actif", contact: "Message à la mairie", report: "Signalement" }

function scalar(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return <span className="text-slate-500">Non renseigné</span>
  if (typeof value === "boolean") return value ? "Oui" : "Non"
  if (typeof value === "string" && ISO_DATE.test(value)) return <time dateTime={value}>{formatDateTime(value)}</time>
  if (typeof value === "string") return VALUE_LABELS[value] ?? value
  return String(value)
}

/** Rendu lisible et générique : objets en listes de définitions, listes en cartes ; le JSON garde tout. */
function DataValue({ value }: { value: unknown }): ReactNode {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-slate-600">Aucun élément.</p>
    return (
      <ol className="space-y-3">
        {value.map((item, index) => (
          <li key={index} data-print="avoid-break" className="rounded-2xl bg-slate-50 p-4">
            <DataValue value={item} />
          </li>
        ))}
      </ol>
    )
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([key]) => !HIDDEN_FIELDS.has(key))
    return (
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(10rem,auto)_1fr]">
        {entries.map(([key, item]) => (
          <div key={key} className="contents">
            <dt className="text-sm font-medium text-slate-600">{FIELD_LABELS[key] ?? key}</dt>
            <dd className="min-w-0 break-words text-slate-900">{item !== null && typeof item === "object" ? <DataValue value={item} /> : scalar(item)}</dd>
          </div>
        ))}
      </dl>
    )
  }
  return <p>{scalar(value)}</p>
}
