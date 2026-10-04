"use client"
import Link from "next/link"
import type { Route } from "next"
import { Clock, MapPin, Navigation, Phone } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { useLocale, useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { COMMON_MESSAGES } from "@/modules/shared/ui/i18n/common-messages"
import { format } from "@/modules/shared/core/i18n/locales"
import type { EmergencyKind, MunicipalService } from "../../core/domain/municipal-service"
import { directionsUrl, distanceKm, formatDistance, hasLocation, localizeService, type Position } from "../../core/domain/service-places"
import { PLACES_MESSAGES, type PlacesMessages } from "../i18n/places-messages"
import { serviceHref } from "./content-cards"

const KIND_KEYS: Record<EmergencyKind, keyof PlacesMessages> = {
  hospital: "kindHospital",
  emergency: "kindEmergency",
  fire: "kindFire",
  police: "kindPolice",
  pharmacy: "kindPharmacy"
}

/** État du service sans couleur seule (icône + libellé), traduit. */
export function ServiceStatus({ status }: { status: string }) {
  const t = useMessages(PLACES_MESSAGES)
  const [tone, label] =
    status === "available" ? (["success", t.statusAvailable] as const)
      : status === "maintenance" ? (["warning", t.statusMaintenance] as const)
        : status === "incident" ? (["danger", t.statusIncident] as const)
          : (["danger", t.statusOther] as const)
  return <StatusBadge tone={tone} label={label} srPrefix={t.statusPrefix} size="md" />
}

/** Numéro de téléphone cliquable, toujours écrit de gauche à droite (y compris en arabe). */
export function PhoneLink({ phone, label }: { phone: string; label: string }) {
  return (
    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-teal-800 underline underline-offset-4">
      <Phone className="size-4" aria-hidden="true" />
      <span>{label}</span> <bdi dir="ltr">{phone}</bdi>
    </a>
  )
}

/** Lieu d’un service (F45, F46) : adresse, horaires, état, appel, itinéraire. */
export function PlaceCard({ service, position, headingLevel = 3 }: { service: MunicipalService; position: Position | null; headingLevel?: 2 | 3 }) {
  const t = useMessages(PLACES_MESSAGES)
  const common = useMessages(COMMON_MESSAGES)
  const { locale, intlLocale } = useLocale()
  const text = localizeService(service, locale)
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const placed = hasLocation(service) ? service.location : null
  return (
    <article className={`flex h-full flex-col gap-3 rounded-2xl border bg-white p-5 ${service.emergency ? "border-red-200" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {service.emergency && <span className="rounded-full bg-red-100 px-3 py-0.5 text-sm font-semibold text-red-900">{t[KIND_KEYS[service.emergency]]}</span>}
        <ServiceStatus status={service.status} />
        {text.untranslated && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700" title={common.notTranslatedHint}>{common.notTranslated}</span>}
      </div>
      <Heading className="text-lg font-semibold text-slate-950" lang={text.untranslated ? "fr" : undefined}>{text.name}</Heading>
      {position && placed && <p className="text-sm font-medium text-slate-700">{format(t.distance, { distance: formatDistance(distanceKm(position, placed), intlLocale) })}</p>}
      <dl className="space-y-2 text-slate-800">
        <div className="flex gap-2"><MapPin className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.address}</dt><dd lang="fr">{placed?.address ?? service.contact.place}</dd></div></div>
        <div className="flex gap-2"><Clock className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" /><div><dt className="sr-only">{t.hours}</dt><dd lang="fr">{service.contact.hours}</dd></div></div>
      </dl>
      {service.status !== "available" && service.statusMessage && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950" lang="fr">{service.statusMessage}</p>}
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-2">
        {service.contact.phone && <PhoneLink phone={service.contact.phone} label={t.call} />}
        {placed && (
          <a href={directionsUrl(placed)} target="_blank" rel="noopener noreferrer" aria-label={format(t.directionsLabel, { name: text.name })} className="inline-flex items-center gap-2 font-semibold text-teal-800 underline underline-offset-4">
            <Navigation className="size-4" aria-hidden="true" /> {t.directions}
          </a>
        )}
        {placed && <Link href={`/carte?service=${encodeURIComponent(service.id)}` as Route} className="font-medium text-teal-800 underline underline-offset-4">{t.showOnMap}</Link>}
        <Link href={serviceHref(service.id)} className="font-medium text-teal-800 underline underline-offset-4">{t.details}</Link>
      </div>
    </article>
  )
}
