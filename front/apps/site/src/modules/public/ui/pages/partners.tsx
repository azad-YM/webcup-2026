"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, ExternalLink, Mail, MapPin, Navigation, Phone, User } from "@boilerplate/shared-ui/components/icon"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { format } from "@/modules/shared/core/i18n/locales"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { CONTENT_POLLING_MS, useListServicesQuery } from "../../core/application/rtk-api/public"
import { openingState, PARTNER_CATEGORY, spokenTime, type MunicipalService, type OpeningSlot } from "../../core/domain/municipal-service"
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
          <ul className="mt-3 list-disc space-y-2 ps-6 text-slate-800" lang="fr">{partner.actions.map((action) => <li key={action}>{action}</li>)}</ul>
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
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((item) => <li key={item.id}><PartnerCard partner={item} t={t} /></li>)}
          </ul>
        )}
      </PageBody>
    </>
  )
}
