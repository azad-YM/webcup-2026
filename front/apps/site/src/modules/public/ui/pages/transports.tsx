"use client"
import { useState, type FormEvent } from "react"
import Link from "@/modules/shared/ui/link"
import { ArrowRight, Bike, Bus, CableCar, Footprints, Phone, Route, Sparkles, TramFront, TriangleAlert, Truck } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useLocale } from "@/modules/shared/ui/i18n/i18n-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { SelectField, TextField } from "@/modules/shared/ui/components/form-field"
import { ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CONTENT_POLLING_MS, useFindTripMutation, useListTransportLinesQuery } from "../../core/application/rtk-api/public"
import { useChosenDistrictQuery } from "../../core/application/rtk-api/alerts"
import { formatMoment } from "../../core/domain/alert"
import {
  LINE_STATUS_LABELS,
  linesForDistrict,
  MODE_LABELS,
  networkPlaces,
  REPLACEMENT_LABELS,
  type LineStatus,
  type Replacement,
  type TransportLine,
  type TransportMode,
  type TripHelp
} from "../../core/domain/transport"

const STATUS_TONES: Record<LineStatus, StatusTone> = { normal: "success", disrupted: "warning", interrupted: "danger" }
const MODE_ICONS: Record<TransportMode, typeof Bus> = { shuttle: Bus, tram: TramFront, bus: Bus, cable: CableCar, rover: Truck }
const REPLACEMENT_ICONS: Record<Replacement["kind"], typeof Bus> = { "substitute-shuttle": Bus, "other-line": Route, "on-demand": Phone, walk: Footprints, bike: Bike }

/** Une solution de remplacement : quoi, où et comment, avec l’état de la ligne proposée si c’en est une. */
function ReplacementItem({ replacement }: { replacement: Replacement }) {
  const Icon = REPLACEMENT_ICONS[replacement.kind]
  return (
    <li className="flex items-start gap-3 rounded-lg bg-white p-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" />
      <div>
        <p className="font-semibold">{replacement.label} <span className="text-sm font-normal text-slate-600">· {REPLACEMENT_LABELS[replacement.kind]}</span></p>
        {replacement.details && <p className="text-sm text-slate-800">{replacement.details}</p>}
        {replacement.lineStatus && replacement.lineStatus !== "normal" && (
          <p className="mt-1 text-sm font-medium text-amber-900">Attention : la ligne {replacement.lineCode} est elle aussi {LINE_STATUS_LABELS[replacement.lineStatus].toLowerCase()}.</p>
        )}
      </div>
    </li>
  )
}

function LineCard({ line, now }: { line: TransportLine; now: number }) {
  const Icon = MODE_ICONS[line.mode]
  return (
    <article aria-labelledby={`ligne-${line.id}`} className={`rounded-2xl border bg-white p-5 ${line.status === "interrupted" ? "border-red-300" : line.status === "disrupted" ? "border-amber-300" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 id={`ligne-${line.id}`} className="flex items-center gap-3 text-lg font-semibold">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-slate-900 text-base font-bold text-white" aria-hidden="true">{line.code}</span>
          <span><span className="sr-only">Ligne {line.code} : </span>{line.name}</span>
        </h3>
        <StatusBadge tone={STATUS_TONES[line.status]} label={LINE_STATUS_LABELS[line.status]} srPrefix="État :" size="md" />
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm text-slate-700"><Icon className="size-4" aria-hidden="true" /> {MODE_LABELS[line.mode]} · {line.stops.join(" → ")}</p>
      {line.frequency && <p className="text-sm text-slate-700">{line.frequency}</p>}
      {line.status !== "normal" && (
        <div className={`mt-3 rounded-xl p-4 ${line.status === "interrupted" ? "bg-red-50 text-red-950" : "bg-amber-50 text-amber-950"}`}>
          <p className="flex items-start gap-2 font-medium"><TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> {line.statusMessage}</p>
          <p className="mt-1 text-sm">
            {line.disruptedSince && <>Depuis {formatMoment(line.disruptedSince, now)}. </>}
            {line.returnAt ? <>Retour prévu : <strong>{formatMoment(line.returnAt, now)}</strong>.</> : "Date de retour non connue."}
          </p>
          {line.replacements.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold">Solutions de remplacement</p>
              <ul className="mt-2 space-y-2">{line.replacements.map((replacement) => <ReplacementItem key={replacement.label} replacement={replacement} />)}</ul>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

/** Réponse de l’aide au trajet : texte clair, puis chaque option avec son verdict et ses remplacements. */
function TripResult({ help }: { help: TripHelp }) {
  if (help.emergency) {
    return (
      <p role="alert" className="rounded-xl border-s-4 border-red-700 bg-red-50 p-4 font-semibold text-red-950">
        {help.answer} {help.emergency.numbers.map((number) => <a key={number} href={`tel:${number}`} className="ms-2 underline">{number}</a>)}
      </p>
    )
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-teal-50 p-4 text-teal-950">
        <p className="text-lg font-medium">{help.answer}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-teal-900">
          {help.source === "model" ? <><Sparkles className="size-3.5" aria-hidden="true" /> Rédigé par l’assistant (IA) à partir de l’état réel des lignes</> : "Calculé à partir de l’état réel des lignes"}
        </p>
      </div>
      {help.options.map((option) => (
        <div key={`${option.lineId}-${option.transfer?.lineId ?? ""}`} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            Ligne {option.code} · {option.name}
            {option.transfer && <><ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /> changement à {option.transfer.stop} pour la ligne {option.transfer.code}</>}
            <StatusBadge tone={option.verdict === "ok" ? "success" : option.verdict === "delayed" ? "warning" : "danger"} label={option.verdict === "ok" ? "Circule" : option.verdict === "delayed" ? "Perturbée" : "Interrompue : remplacement"} />
          </p>
          {option.statusMessage && option.verdict !== "ok" && <p className="mt-1 text-sm text-slate-800">{option.statusMessage}</p>}
          {option.replacements.length > 0 && <ul className="mt-2 space-y-2">{option.replacements.map((replacement) => <ReplacementItem key={replacement.label} replacement={replacement} />)}</ul>}
        </div>
      ))}
    </div>
  )
}

/**
 * Transports (F36, F97) : l’état de chaque ligne et, pour une ligne interrompue, ses solutions de remplacement ;
 * « Où allez-vous ? » (départ et destination, ou une phrase) trouve la ligne à prendre ou le remplacement.
 * L’état des lignes reste affiché sans l’aide au trajet (mode allégé, panne de l’assistance).
 */
export function TransportsPage() {
  const { locale } = useLocale()
  const lines = useListTransportLinesQuery(undefined, polling(CONTENT_POLLING_MS))
  const chosen = useChosenDistrictQuery()
  const [findTrip, trip] = useFindTripMutation()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [question, setQuestion] = useState("")
  const now = Date.now()
  const data = lines.data ?? []
  const places = networkPlaces(data)
  const options = [...places.stops.map((value) => ({ value, label: value })), ...places.districts.map((value) => ({ value, label: `Quartier ${value}` }))]
  const interrupted = data.filter((line) => line.status === "interrupted")
  const disrupted = data.filter((line) => line.status === "disrupted")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim() && !from && !to) return
    void findTrip({ question: question.trim(), from: from || null, to: to || null, language: locale })
  }
  return (
    <>
      <PageHeader
        trail={[{ label: "Transports" }]}
        title="Transports : lignes et solutions de remplacement"
        lead="L’état de chaque ligne en temps réel. Si votre ligne est interrompue, la ville vous indique comment vous déplacer autrement."
      >
        {lines.data && (
          <p role="status" className={`mt-4 rounded-xl border-s-4 p-4 font-medium ${interrupted.length > 0 ? "border-red-700 bg-red-50 text-red-950" : disrupted.length > 0 ? "border-amber-500 bg-amber-50 text-amber-950" : "border-emerald-700 bg-emerald-50 text-emerald-950"}`}>
            {interrupted.length === 0 && disrupted.length === 0
              ? "Toutes les lignes circulent normalement."
              : [
                  interrupted.length > 0 && `${interrupted.length} ligne${interrupted.length > 1 ? "s" : ""} interrompue${interrupted.length > 1 ? "s" : ""} (${interrupted.map((line) => line.code).join(", ")}) : solutions de remplacement ci-dessous`,
                  disrupted.length > 0 && `${disrupted.length} perturbée${disrupted.length > 1 ? "s" : ""} (${disrupted.map((line) => line.code).join(", ")})`
                ].filter(Boolean).join(" · ") + "."}
          </p>
        )}
      </PageHeader>
      <PageBody>
        <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section aria-labelledby="titre-trajet" className="space-y-4">
            <h2 id="titre-trajet" className="text-2xl font-semibold tracking-tight">Où allez-vous ?</h2>
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <SelectField id="trajet-depart" label="Départ" placeholder="Choisir un arrêt ou un quartier" options={options} value={from} onChange={(event) => setFrom(event.target.value)} optional />
              <SelectField id="trajet-destination" label="Destination" placeholder="Choisir un arrêt ou un quartier" options={options} value={to} onChange={(event) => setTo(event.target.value)} optional />
              <TextField id="trajet-phrase" label="Ou décrivez votre trajet" hint="Ex. « Je dois aller du Port à l’hôpital »" value={question} maxLength={500} onChange={(event) => setQuestion(event.target.value)} optional />
              <button type="submit" disabled={trip.isLoading} className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {trip.isLoading ? "Recherche…" : "Trouver mon trajet"}
              </button>
            </form>
            <div aria-live="polite">
              {trip.error && <ErrorState message={toQueryError(trip.error)?.data ?? "L’aide au trajet est indisponible."} />}
              {trip.data && <TripResult help={trip.data} />}
            </div>
            <p className="text-sm text-slate-700">
              Besoin d’aide pour vous déplacer (mobilité réduite) ? <Link href="/services?service=transports" className="font-medium text-teal-800 underline underline-offset-4">Service Mobilité</Link>
            </p>
          </section>
          <section aria-labelledby="titre-lignes" className="space-y-4">
            <h2 id="titre-lignes" className="text-2xl font-semibold tracking-tight">État des lignes</h2>
            {lines.error && !lines.data ? (
              <ErrorState message={toQueryError(lines.error)?.data ?? "Impossible de charger l’état des lignes."} onRetry={() => void lines.refetch()} retrying={lines.isFetching} />
            ) : !lines.data ? (
              <LoadingState label="Chargement de l’état des lignes"><SkeletonCards count={3} /></LoadingState>
            ) : (
              linesForDistrict(data, chosen.data ?? null).map((line) => <LineCard key={line.id} line={line} now={now} />)
            )}
          </section>
        </div>
      </PageBody>
    </>
  )
}
