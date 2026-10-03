"use client"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarCheck, CalendarClock, CalendarX, Clock, FileText, MapPin } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { EmptyState, ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import {
  APPOINTMENTS_POLLING_MS,
  useBookAppointmentMutation,
  useChangeAppointmentMutation,
  useGetAppointmentOfferQuery,
  useListMyAppointmentsQuery
} from "../../core/application/rtk-api/appointments"
import { dayLabel, isUpcoming, localDay, localTime, type Appointment, type AppointmentSlot } from "../../core/domain/appointment"

const button = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium disabled:opacity-60"
const primary = `${button} bg-teal-700 text-white hover:bg-teal-800`
const secondary = `${button} border border-slate-300 bg-white hover:bg-slate-50`

/** Récapitulatif sans ambiguïté : date, heure, fuseau, durée, lieu, pièces à apporter (F39). */
function AppointmentFacts({ item }: { item: Pick<Appointment, "serviceName" | "when" | "timezoneLabel" | "durationMinutes" | "location" | "instructions" | "startsAt" | "endsAt"> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <div>
        <dt className="text-sm text-slate-600">Service</dt>
        <dd className="font-medium text-slate-950">{item.serviceName}</dd>
      </div>
      <div>
        <dt className="flex items-center gap-1 text-sm text-slate-600"><CalendarClock className="size-4" aria-hidden="true" /> Date et heure</dt>
        <dd className="font-medium text-slate-950">
          <time dateTime={item.startsAt}>{item.when}</time> <span className="font-normal text-slate-700">({item.timezoneLabel})</span>
        </dd>
      </div>
      <div>
        <dt className="flex items-center gap-1 text-sm text-slate-600"><Clock className="size-4" aria-hidden="true" /> Durée</dt>
        <dd className="font-medium text-slate-950">{item.durationMinutes} minutes, fin prévue à <time dateTime={item.endsAt}>{localTime(item.endsAt)}</time></dd>
      </div>
      <div>
        <dt className="flex items-center gap-1 text-sm text-slate-600"><MapPin className="size-4" aria-hidden="true" /> Lieu</dt>
        <dd className="font-medium text-slate-950">{item.location}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="flex items-center gap-1 text-sm text-slate-600"><FileText className="size-4" aria-hidden="true" /> À apporter</dt>
        <dd className="whitespace-pre-wrap text-slate-900">{item.instructions || "Aucune pièce particulière demandée."}</dd>
      </div>
    </dl>
  )
}

/** Choix du service puis d'un créneau libre, et confirmation explicite. `moving` : déplacement d'un rendez-vous. */
function BookingFlow({ moving, onDone }: { moving: Appointment | null; onDone: (appointment: Appointment) => void }) {
  const [serviceId, setServiceId] = useState<string | null>(moving?.serviceId ?? null)
  const [slot, setSlot] = useState<AppointmentSlot | null>(null)
  const offer = useGetAppointmentOfferQuery(serviceId, { pollingInterval: APPOINTMENTS_POLLING_MS })
  const [book, booking] = useBookAppointmentMutation()
  const [change, changing] = useChangeAppointmentMutation()
  const failure = toQueryError(offer.error)
  const actionError = toQueryError(booking.error ?? changing.error)
  const busy = booking.isLoading || changing.isLoading
  const days = new Map<string, AppointmentSlot[]>()
  for (const item of offer.data?.slots ?? []) days.set(localDay(item.startsAt), [...(days.get(localDay(item.startsAt)) ?? []), item])

  const confirm = async () => {
    if (!slot || busy) return
    const result = moving ? await change({ appointmentId: moving.id, slotId: slot.id }) : await book(slot.id)
    if ("data" in result && result.data) onDone(result.data)
    else setSlot(null)
  }

  if (offer.isLoading) return <LoadingState label="Chargement des créneaux disponibles…" />
  if (failure && !offer.data) return <ErrorState message={failure.data} onRetry={() => void offer.refetch()} retrying={offer.isFetching} />
  const services = offer.data?.services ?? []
  return (
    <div className="space-y-6">
      {!moving && (
        <fieldset>
          <legend className="text-lg font-semibold">1. Choisissez le service</legend>
          {services.length === 0 ? (
            <p className="mt-3 text-slate-700">Aucun créneau n’est ouvert pour le moment. Les agents publient régulièrement de nouveaux créneaux : revenez bientôt ou contactez la mairie depuis « Mes demandes ».</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <li key={service.serviceId}>
                  <label className={`flex h-full cursor-pointer gap-3 rounded-xl border p-4 ${serviceId === service.serviceId ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-600"}`}>
                    <input type="radio" name="service" className="mt-1 size-4 accent-teal-700" checked={serviceId === service.serviceId} onChange={() => { setServiceId(service.serviceId); setSlot(null) }} />
                    <span>
                      <span className="block font-semibold text-slate-950">{service.serviceName}</span>
                      <span className="block text-sm text-slate-700">{service.openSlots} créneau{service.openSlots > 1 ? "x" : ""} libre{service.openSlots > 1 ? "s" : ""} · prochain : {service.nextWhen}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}
      {serviceId && (
        <fieldset>
          <legend className="text-lg font-semibold">{moving ? "Choisissez votre nouveau créneau" : "2. Choisissez un créneau"}</legend>
          <p className="mt-1 text-sm text-slate-700">Horaires affichés en {offer.data?.timezoneLabel}.</p>
          {days.size === 0 ? (
            <p className="mt-3 text-slate-700">Plus aucun créneau libre pour ce service. Choisissez un autre service ou revenez plus tard.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {[...days.entries()].map(([day, slots]) => (
                <div key={day}>
                  <p className="font-medium capitalize text-slate-900">{dayLabel(slots[0]!)}</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {slots.map((item) => (
                      <li key={item.id}>
                        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${slot?.id === item.id ? "border-teal-700 bg-teal-50 font-semibold" : "border-slate-300 bg-white hover:border-teal-600"}`}>
                          <input type="radio" name="slot" className="size-4 accent-teal-700" checked={slot?.id === item.id} onChange={() => setSlot(item)} />
                          {localTime(item.startsAt)} <span className="text-sm font-normal text-slate-600">({item.durationMinutes} min)</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      )}
      {slot && (
        <section aria-labelledby="titre-recapitulatif" className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6">
          <h2 id="titre-recapitulatif" className="text-lg font-semibold">{moving ? "Vérifiez votre nouveau rendez-vous" : "3. Vérifiez puis confirmez"}</h2>
          <div className="mt-4"><AppointmentFacts item={slot} /></div>
          {actionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-900">{actionError.data}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className={primary} disabled={busy} onClick={() => void confirm()}>
              <CalendarCheck className="size-5" aria-hidden="true" /> {busy ? "Enregistrement…" : moving ? "Confirmer le déplacement" : "Confirmer le rendez-vous"}
            </button>
            <button type="button" className={secondary} disabled={busy} onClick={() => setSlot(null)}>Choisir un autre créneau</button>
          </div>
        </section>
      )}
      {!slot && actionError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-900">{actionError.data}</p>}
    </div>
  )
}

function AppointmentCard({ appointment, highlighted, onMove }: { appointment: Appointment; highlighted: boolean; onMove: (appointment: Appointment) => void }) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [change, changing] = useChangeAppointmentMutation()
  const error = toQueryError(changing.error)
  const upcoming = isUpcoming(appointment)
  return (
    <article id={`rdv-${appointment.id}`} aria-labelledby={`titre-rdv-${appointment.id}`} className={`rounded-2xl border bg-white p-6 ${highlighted ? "border-teal-700 ring-2 ring-teal-200" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`titre-rdv-${appointment.id}`} className="text-lg font-semibold text-slate-950">Rendez-vous {appointment.reference}</h3>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${appointment.status === "cancelled" ? "bg-slate-100 text-slate-800" : upcoming ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-800"}`}>
          {appointment.status === "cancelled" ? "Annulé" : upcoming ? "Confirmé" : "Passé"}
        </span>
      </div>
      <div className="mt-4"><AppointmentFacts item={appointment} /></div>
      {upcoming && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={secondary} onClick={() => onMove(appointment)}><CalendarClock className="size-5" aria-hidden="true" /> Déplacer</button>
          {!confirmCancel ? (
            <button type="button" className={secondary} onClick={() => setConfirmCancel(true)}><CalendarX className="size-5" aria-hidden="true" /> Annuler</button>
          ) : (
            <div role="group" aria-label="Confirmer l’annulation" className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3">
              <span className="text-slate-900">Annuler ce rendez-vous ? Le créneau sera proposé à d’autres habitants.</span>
              <button type="button" className={`${button} bg-red-700 text-white hover:bg-red-800`} disabled={changing.isLoading} onClick={() => void change({ appointmentId: appointment.id, slotId: null })}>
                {changing.isLoading ? "Annulation…" : "Oui, annuler"}
              </button>
              <button type="button" className={secondary} onClick={() => setConfirmCancel(false)}>Non, garder</button>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-red-900">{error.data}</p>}
    </article>
  )
}

function AppointmentsContent() {
  const highlight = useSearchParams().get("id")
  const { logout } = useSession()
  const query = useListMyAppointmentsQuery(undefined, { pollingInterval: APPOINTMENTS_POLLING_MS })
  const [mode, setMode] = useState<{ kind: "list" } | { kind: "book" } | { kind: "move"; appointment: Appointment }>({ kind: "list" })
  const [confirmed, setConfirmed] = useState<Appointment | null>(null)
  const confirmation = useRef<HTMLHeadingElement>(null)
  const failure = toQueryError(query.error)
  useEffect(() => { if (failure?.status === 401) logout() }, [failure?.status, logout])
  useEffect(() => { if (confirmed) confirmation.current?.focus() }, [confirmed])
  const items = query.data ?? []
  const upcoming = items.filter(isUpcoming)
  const others = items.filter((item) => !isUpcoming(item))

  if (mode.kind !== "list") {
    return (
      <section aria-labelledby="titre-prise-rdv" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titre-prise-rdv" className="text-2xl font-semibold tracking-tight">{mode.kind === "move" ? `Déplacer le rendez-vous ${mode.appointment.reference}` : "Prendre rendez-vous"}</h2>
          <button type="button" className={secondary} onClick={() => setMode({ kind: "list" })}>Retour à mes rendez-vous</button>
        </div>
        <BookingFlow
          moving={mode.kind === "move" ? mode.appointment : null}
          onDone={(appointment) => { setConfirmed(appointment); setMode({ kind: "list" }) }}
        />
      </section>
    )
  }
  return (
    <div className="space-y-8">
      {confirmed && (
        <section role="status" aria-labelledby="titre-confirmation-rdv" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
          <h2 id="titre-confirmation-rdv" ref={confirmation} tabIndex={-1} className="flex items-center gap-2 text-xl font-semibold text-emerald-950">
            <CalendarCheck className="size-6" aria-hidden="true" /> Rendez-vous {confirmed.reference} confirmé
          </h2>
          <p className="mt-1 text-slate-800">Vous recevrez un rappel dans votre espace la veille et 2 heures avant. Vous pouvez le déplacer ou l’annuler ci-dessous.</p>
          <div className="mt-4"><AppointmentFacts item={confirmed} /></div>
        </section>
      )}
      <button type="button" className={primary} onClick={() => { setConfirmed(null); setMode({ kind: "book" }) }}>
        <CalendarCheck className="size-5" aria-hidden="true" /> Prendre un rendez-vous
      </button>
      <section aria-labelledby="titre-rdv-a-venir">
        <h2 id="titre-rdv-a-venir" className="text-2xl font-semibold tracking-tight">À venir</h2>
        <div className="mt-4 space-y-4">
          {query.isLoading ? (
            <LoadingState label="Chargement de vos rendez-vous…" />
          ) : failure && !query.data ? (
            failure.status === 401 ? null : <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          ) : upcoming.length === 0 ? (
            <EmptyState title="Aucun rendez-vous à venir.">Prenez rendez-vous avec un agent : vous choisissez le service et le créneau qui vous conviennent.</EmptyState>
          ) : (
            upcoming.map((item) => <AppointmentCard key={item.id} appointment={item} highlighted={item.id === highlight} onMove={(appointment) => setMode({ kind: "move", appointment })} />)
          )}
        </div>
      </section>
      {others.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white p-6">
          <summary className="cursor-pointer font-semibold">Rendez-vous passés ou annulés ({others.length})</summary>
          <div className="mt-4 space-y-4">
            {others.map((item) => <AppointmentCard key={item.id} appointment={item} highlighted={item.id === highlight} onMove={() => undefined} />)}
          </div>
        </details>
      )}
    </div>
  )
}

/** « Mes rendez-vous » (F39, F40) : prise, déplacement et annulation d'un rendez-vous avec un agent. */
export function AppointmentsPage() {
  const access = useCitizenAccess()
  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace", href: "/espace" }, { label: "Mes rendez-vous" }]}
        title="Mes rendez-vous"
        lead="Rencontrez un agent de la mairie au créneau qui vous convient. Chaque rendez-vous indique la date, l’heure, le lieu, la durée et les pièces à apporter."
      />
      <PageBody>
        {!access.profile ? <CitizenAccessState access={access} returnTo="/espace/rendez-vous" /> : <AppointmentsContent />}
      </PageBody>
    </>
  )
}
