"use client"
import { useEffect, useState } from "react"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Mail, MapPin, Navigation, Phone, User } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { format } from "@/modules/shared/core/i18n/locales"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { CONTENT_POLLING_MS, useListServicesQuery } from "../../core/application/rtk-api/public"
import { isOfferAvailable, offerActionHref, openingState, PARTNER_CATEGORY, spokenTime, type MunicipalService, type OfferStatus, type OpeningSlot, type PartnerOffer } from "../../core/domain/municipal-service"
import { directionsUrl, hasLocation } from "../../core/domain/service-places"
import { PARTNERS_MESSAGES, type PartnersMessages } from "../i18n/partners-messages"
import { PhoneLink } from "../components/place-card"
import { OnDemandMap } from "../components/on-demand-map"

const partnerHref = (id: string) => `/partenaires?id=${encodeURIComponent(id)}` as Route
const dayName = (t: PartnersMessages, day: number) => (t as Record<string, string>)[`day${day}`] ?? String(day)

/** Heure courante côté navigateur seulement (export statique), rafraîchie chaque minute. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

/** « Ouvert maintenant · ferme à 18 h » / « Fermé · ouvre lundi à 9 h » (texte, pas seulement la couleur). */
function OpenNow({ slots, t }: { slots: OpeningSlot[] | undefined; t: PartnersMessages }) {
  const now = useNow()
  if (!now) return null
  const state = openingState(slots, now)
  if (!state) return <p className="text-sm text-slate-700">{t.hoursUnknown}</p>
  return state.open ? (
    <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900">
      <span aria-hidden="true" className="size-2 rounded-full bg-emerald-700" />{t.openNow} · {format(t.closesAt, { time: spokenTime(state.closes) })}
    </p>
  ) : (
    <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
      <span aria-hidden="true" className="size-2 rounded-full bg-slate-500" />{t.closed} · {state.sameDay ? format(t.opensToday, { time: spokenTime(state.opens) }) : format(t.opensOn, { day: dayName(t, state.opensDay), time: spokenTime(state.opens) })}
    </p>
  )
}

const OFFER_TONES: Record<OfferStatus, StatusTone> = { available: "success", limited: "warning", full: "danger", paused: "neutral", soon: "pending" }
const OFFER_LABEL_KEYS: Record<OfferStatus, keyof PartnersMessages> = { available: "statusAvailable", limited: "statusLimited", full: "statusFull", paused: "statusPaused", soon: "statusSoon" }
const offerDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" })

/**
 * F99 : une offre de partenaire lisible d’un coup d’œil — disponible ou non (texte et icône, pas seulement la couleur),
 * pour qui, quand elle revient, et un bouton pour la prochaine étape.
 */
function OfferCard({ offer, partner, t, showPartner }: { offer: PartnerOffer; partner: MunicipalService; t: PartnersMessages; showPartner?: boolean }) {
  const action = offerActionHref(offer, partner)
  const available = isOfferAvailable(offer)
  return (
    <article className={`flex h-full flex-col gap-2 rounded-2xl border bg-white p-5 ${available ? "border-slate-200" : "border-dashed border-slate-300"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-950" lang="fr">{offer.title}</h3>
        <StatusBadge tone={OFFER_TONES[offer.status]} label={t[OFFER_LABEL_KEYS[offer.status]]} size="md" />
      </div>
      {showPartner && <p className="text-sm"><Link href={partnerHref(partner.id)} className="font-medium text-teal-800 underline underline-offset-4">{partner.name}</Link></p>}
      {offer.description && <p className="text-slate-700" lang="fr">{offer.description}</p>}
      {offer.audience && <p className="text-sm text-slate-700"><span className="font-medium">{t.forWhom} :</span> <span lang="fr">{offer.audience}</span></p>}
      {offer.statusNote && <p className={`text-sm font-medium ${available ? "text-slate-800" : "text-amber-900"}`} lang="fr">{offer.statusNote}</p>}
      {!available && offer.nextAvailableAt && <p className="text-sm text-slate-800">{format(t.availableAgain, { date: offerDate.format(new Date(offer.nextAvailableAt)) })}</p>}
      <div className="mt-auto pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t.nextStep}</p>
        {action ? (
          <a href={action.href} {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`mt-1 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium ${available ? "bg-teal-700 text-white hover:bg-teal-800" : "border border-slate-300 text-slate-900 hover:bg-slate-100"}`}>
            <span lang="fr">{offer.action.label}</span> <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </a>
        ) : (
          <p className="mt-1 font-medium" lang="fr">{offer.action.label}</p>
        )}
      </div>
    </article>
  )
}

type OfferFilter = "all" | "available" | "unavailable"

/** F99 : toutes les offres des partenaires, disponibles d’abord, avec un filtre et le décompte. */
function PartnerOffers({ partners, t }: { partners: MunicipalService[]; t: PartnersMessages }) {
  const [filter, setFilter] = useState<OfferFilter>("all")
  const all = partners.flatMap((partner) => (partner.offers ?? []).map((offer) => ({ offer, partner })))
  if (all.length === 0) return null
  const available = all.filter(({ offer }) => isOfferAvailable(offer))
  const shown = (filter === "available" ? available : filter === "unavailable" ? all.filter(({ offer }) => !isOfferAvailable(offer)) : all)
    .sort((a, b) => Number(isOfferAvailable(b.offer)) - Number(isOfferAvailable(a.offer)))
  return (
    <section aria-labelledby="titre-offres" className="mb-12 space-y-4">
      <div>
        <h2 id="titre-offres" className="text-2xl font-semibold tracking-tight">{t.offersTitle}</h2>
        <p className="mt-1 text-slate-700">{t.offersLead}</p>
        <p className="mt-2 font-medium" role="status">{format(t.offersSummary, { available: String(available.length), unavailable: String(all.length - available.length) })}</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t.offersTitle}>
        {(["all", "available", "unavailable"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${filter === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white hover:bg-slate-100"}`}>
            {value === "all" ? t.filterAll : value === "available" ? t.filterAvailable : t.filterUnavailable}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="text-slate-700">{t.noOfferMatch}</p> : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ offer, partner }) => <li key={`${partner.id}-${offer.id}`}><OfferCard offer={offer} partner={partner} t={t} showPartner /></li>)}
        </ul>
      )}
    </section>
  )
}

function ProposeServices({ t }: { t: PartnersMessages }) {
  return (
    <section aria-labelledby="titre-proposer" className="mt-12 rounded-2xl border border-teal-200 bg-teal-50 p-6">
      <h2 id="titre-proposer" className="text-xl font-semibold text-teal-950">{t.proposeTitle}</h2>
      <p className="mt-2 max-w-3xl text-teal-950">{t.proposeText}</p>
      <Link href={"/espace/demandes/nouvelle?type=contact" as Route} className="mt-3 inline-flex items-center gap-2 font-medium text-teal-900 underline underline-offset-4">{t.proposeLink} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link>
    </section>
  )
}

function WeeklyHours({ slots, t }: { slots: OpeningSlot[]; t: PartnersMessages }) {
  return (
    <table className="mt-3 w-full text-start text-sm">
      <caption className="sr-only">{t.openingHours}</caption>
      <tbody>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const today = slots.filter((slot) => slot.day === day)
          return (
            <tr key={day} className="border-b border-slate-100 last:border-0">
              <th scope="row" className="py-1.5 pe-4 text-start font-medium capitalize">{dayName(t, day)}</th>
              <td className="py-1.5" dir="ltr">{today.length === 0 ? <span dir="auto">{t.closedDay}</span> : today.map((slot) => `${spokenTime(slot.opens)} – ${spokenTime(slot.closes)}`).join(", ")}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function PartnerDetail({ partner, t }: { partner: MunicipalService; t: PartnersMessages }) {
  const contact = partner.contact
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <OpenNow slots={contact.openingHours} t={t} />
        <p className="text-lg leading-8 text-slate-800" lang="fr">{partner.description}</p>
        <section aria-labelledby="titre-propose">
          <h2 id="titre-propose" className="text-xl font-semibold">{t.whatTheyOffer}</h2>
          {partner.offers && partner.offers.length > 0 ? (
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {[...partner.offers].sort((a, b) => Number(isOfferAvailable(b)) - Number(isOfferAvailable(a))).map((offer) => <li key={offer.id}><OfferCard offer={offer} partner={partner} t={t} /></li>)}
            </ul>
          ) : (
            <ul className="mt-3 list-disc space-y-2 ps-6 text-slate-800" lang="fr">{partner.actions.map((action) => <li key={action}>{action}</li>)}</ul>
          )}
        </section>
        <section aria-labelledby="titre-trouver" className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 id="titre-trouver" className="text-xl font-semibold">{t.findUs}</h2>
          <p className="mt-3 flex gap-3 text-slate-800"><MapPin className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><span lang="fr">{partner.location?.address ?? contact.place}</span></p>
          {hasLocation(partner) && (
            <>
              <p className="mt-3 flex flex-wrap gap-4">
                <a href={directionsUrl(partner.location)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-teal-800 underline underline-offset-4">
                  <Navigation className="size-4" aria-hidden="true" /> {t.directions}
                </a>
                <Link href={`/carte?service=${encodeURIComponent(partner.id)}` as Route} className="font-medium text-teal-800 underline underline-offset-4">{t.showOnMap}</Link>
              </p>
              <div className="mt-4"><OnDemandMap services={[partner]} focusId={partner.id} compact /></div>
            </>
          )}
        </section>
      </div>
      <aside aria-labelledby="titre-contact-partenaire" className="h-fit space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Clock className="size-5 text-teal-700" aria-hidden="true" /> {t.openingHours}</h2>
          {contact.openingHours && contact.openingHours.length > 0 ? <WeeklyHours slots={contact.openingHours} t={t} /> : <p className="mt-2" lang="fr">{contact.hours}</p>}
          <p className="mt-2 text-xs text-slate-600">{t.cityTime}</p>
        </section>
        <section>
          <h2 id="titre-contact-partenaire" className="text-lg font-semibold">{t.contact}</h2>
          <dl className="mt-3 space-y-3 text-slate-800">
            {contact.person && <div className="flex gap-3"><User className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.person}</dt><dd lang="fr">{contact.person}</dd></div></div>}
            {contact.phone && <div className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.phone}</dt><dd><PhoneLink phone={contact.phone} label="" /></dd></div></div>}
            {contact.email && <div className="flex gap-3"><Mail className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.email}</dt><dd dir="ltr"><a href={`mailto:${contact.email}`} className="break-all font-medium text-teal-800 underline">{contact.email}</a></dd></div></div>}
            {contact.website && <div className="flex gap-3"><ExternalLink className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.website}</dt><dd dir="ltr"><a href={contact.website} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-teal-800 underline">{contact.website.replace(/^https?:\/\//, "")}</a></dd></div></div>}
          </dl>
        </section>
      </aside>
      <p className="lg:col-span-2">
        <Link href={"/partenaires" as Route} className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" /> {t.allPartners}
        </Link>
      </p>
    </div>
  )
}

function PartnerCard({ partner, t }: { partner: MunicipalService; t: PartnersMessages }) {
  return (
    <article aria-labelledby={`partenaire-${partner.id}`} className="relative flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 id={`partenaire-${partner.id}`} className="text-lg font-semibold text-slate-950">
        <Link href={partnerHref(partner.id)} className="after:absolute after:inset-0 after:rounded-2xl">{partner.name}</Link>
      </h2>
      <p className="text-slate-700" lang="fr">{partner.summary}</p>
      <p className="flex gap-2 text-sm text-slate-700"><MapPin className="size-4 shrink-0 text-teal-700" aria-hidden="true" /><span lang="fr">{partner.location?.address ?? partner.contact.place}</span></p>
      {partner.offers && partner.offers.length > 0 && (
        <p className="text-sm text-slate-800">{format(t.offersSummary, { available: String(partner.offers.filter(isOfferAvailable).length), unavailable: String(partner.offers.filter((offer) => !isOfferAvailable(offer)).length) })}</p>
      )}
      <div className="mt-auto"><OpenNow slots={partner.contact.openingHours} t={t} /></div>
    </article>
  )
}

/** F74 : associations partenaires — liste, puis fiche via `?id=` (export statique). */
export function PartnersPage() {
  const t = useMessages(PARTNERS_MESSAGES)
  const id = useSearchParams().get("id")
  const { data, error, isFetching, refetch } = useListServicesQuery(undefined, polling(CONTENT_POLLING_MS))
  const partners = (data ?? []).filter((service) => service.category === PARTNER_CATEGORY)
  const partner = id ? partners.find((item) => item.id === id) : null
  return (
    <>
      {partner
        ? <PageHeader trail={[{ label: t.title, href: "/partenaires" }, { label: partner.name }]} title={partner.name} lead={partner.summary} />
        : <PageHeader trail={[{ label: t.title }]} title={t.title} lead={t.lead} />}
      <PageBody>
        {error ? (
          <ErrorState message={toQueryError(error)?.data ?? t.loadError} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label={t.loading}><SkeletonCards count={3} /></LoadingState>
        ) : id && !partner ? (
          <EmptyState title={t.notFound}><Link href={"/partenaires" as Route} className="font-medium text-teal-800 underline">{t.allPartners}</Link></EmptyState>
        ) : partner ? (
          <PartnerDetail partner={partner} t={t} />
        ) : partners.length === 0 ? (
          <EmptyState title={t.empty} />
        ) : (
          <>
            <PartnerOffers partners={partners} t={t} />
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((item) => <li key={item.id}><PartnerCard partner={item} t={t} /></li>)}
            </ul>
            <ProposeServices t={t} />
          </>
        )}
      </PageBody>
    </>
  )
}
