import { useState, type FormEvent } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { RefreshCw, Trash2 } from "@boilerplate/shared-ui/components/icon"
import { Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@boilerplate/shared-ui/components"
import { MaskedValue, SensitiveDataBar } from "@/modules/shared/ui/components/custom/sensitive-data"
import { DESK_POLLING_MS, useAppointmentDayQuery, useOpenSlotsMutation, useRemoveSlotMutation } from "../../core/application/rtk-api/agent-desk"
import { cityToday, localTime, type AppointmentDay } from "../../core/domain/agent-desk"
import { RequestQueueSkeleton } from "../sections/request-queue-skeleton"

const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"

function OpenSlotsForm({ day }: { day: AppointmentDay }) {
  const [serviceId, setServiceId] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [durationMinutes, setDuration] = useState(30)
  const [count, setCount] = useState(4)
  const [location, setLocation] = useState("")
  const [instructions, setInstructions] = useState("")
  const [openSlots, opening] = useOpenSlotsMutation()
  const [done, setDone] = useState<string | null>(null)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (opening.isLoading || !serviceId) return
    setDone(null)
    const result = await openSlots({ serviceId, date: day.date, startTime, durationMinutes, count, location: location.trim() || null, instructions: instructions.trim() || null })
    if (!("error" in result)) setDone(`${count} créneau(x) ouvert(s) le ${day.date} à partir de ${startTime}.`)
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-xl border bg-white p-5" aria-labelledby="titre-ouvrir-creneaux">
      <h2 id="titre-ouvrir-creneaux" className="text-lg font-semibold">Ouvrir des créneaux le {day.date}</h2>
      <p className="text-sm text-muted-foreground">Heures saisies en {day.timezoneLabel}. Créneaux consécutifs : un rendez-vous par créneau.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="slot-service">Service</Label>
          <select id="slot-service" required className={selectClass} value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            <option value="">Choisir un service…</option>
            {day.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="slot-start">Premier créneau</Label>
          <Input id="slot-start" type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slot-duration">Durée (min)</Label>
          <Input id="slot-duration" type="number" min={5} max={240} required value={durationMinutes} onChange={(event) => setDuration(Number(event.target.value))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slot-count">Nombre de créneaux</Label>
          <Input id="slot-count" type="number" min={1} max={20} required value={count} onChange={(event) => setCount(Number(event.target.value))} />
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="slot-location">Lieu (vide : accueil du service)</Label>
          <Input id="slot-location" maxLength={255} value={location} onChange={(event) => setLocation(event.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-4">
          <Label htmlFor="slot-instructions">Pièces à apporter, consignes</Label>
          <Textarea id="slot-instructions" maxLength={2000} value={instructions} onChange={(event) => setInstructions(event.target.value)} />
        </div>
      </div>
      {opening.error ? <p role="alert" className="text-sm text-destructive">{getErrorMessage(opening.error)}</p> : null}
      <p role="status" className="text-sm text-emerald-800">{done}</p>
      <Button type="submit" disabled={opening.isLoading || !serviceId}>{opening.isLoading ? "Ouverture…" : "Ouvrir les créneaux"}</Button>
    </form>
  )
}

/** Guichet des rendez-vous (F39) : rendez-vous du jour, ouverture et retrait de créneaux. */
export function AppointmentsPage() {
  const [date, setDate] = useState(cityToday)
  const [reveal, setReveal] = useState(false)
  // F70 : chaque affichage des téléphones est journalisé ; pas de rafraîchissement périodique dans ce mode.
  const query = useAppointmentDayQuery({ date, reveal }, { pollingInterval: reveal ? 0 : DESK_POLLING_MS })
  const [removeSlot, removing] = useRemoveSlotMutation()
  const day = query.currentData
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
            Rendez-vous
            {day && <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900">{day.bookedCount} réservé(s)</span>}
          </h1>
          <p className="mt-1 text-muted-foreground">Créneaux et rendez-vous des habitants, jour par jour. Mise à jour en temps réel.</p>
        </div>
        <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw className={query.isFetching ? "animate-spin" : undefined} /> Actualiser
        </Button>
      </div>
      <div className="w-56 space-y-1">
        <Label htmlFor="desk-date">Jour</Label>
        <Input id="desk-date" type="date" value={date} onChange={(event) => event.target.value && setDate(event.target.value)} />
      </div>
      <SensitiveDataBar meta={day?.sensitive} revealed={reveal} onChange={setReveal} busy={query.isFetching} />
      {query.isFetching && (!day || day.items.length === 0) ? (
        <RequestQueueSkeleton label="Chargement des rendez-vous…" />
      ) : query.error && !day ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-white p-4">
          <p>{getErrorMessage(query.error)}</p>
          <Button className="mt-3" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>
      ) : day ? (
        <>
          {removing.error ? <p role="alert" className="text-sm text-destructive">{getErrorMessage(removing.error)}</p> : null}
          {day.items.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-muted-foreground">Aucun créneau ce jour-là{day.canManage ? " : ouvrez-en ci-dessous." : "."}</p>
          ) : (
            <div className="nt-data-table overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Heure ({day.timezone})</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Rendez-vous</TableHead>
                    {day.canManage && <TableHead><span className="sr-only">Actions</span></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {day.items.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="whitespace-nowrap font-medium">{localTime(slot.startsAt)} – {localTime(slot.endsAt)}</TableCell>
                      <TableCell>{slot.serviceName}</TableCell>
                      <TableCell>{slot.location}</TableCell>
                      <TableCell>
                        {slot.appointment ? (
                          <span>
                            <span className="font-medium">{slot.appointment.citizenName}</span> · {slot.appointment.reference}
                            {slot.appointment.maskedFields?.includes("citizenPhone")
                              ? <> · <span className="sr-only">Téléphone : </span><MaskedValue field="citizenPhone" masked={slot.appointment.maskedFields} value={null} /></>
                              : slot.appointment.citizenPhone && <> · {slot.appointment.citizenPhone}</>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Libre</span>
                        )}
                      </TableCell>
                      {day.canManage && (
                        <TableCell>
                          {!slot.appointment && (
                            <Button type="button" variant="ghost" size="sm" disabled={removing.isLoading} onClick={() => void removeSlot(slot.id)}>
                              <Trash2 aria-hidden="true" /> Retirer<span className="sr-only"> le créneau de {localTime(slot.startsAt)}</span>
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {day.canManage && <OpenSlotsForm key={day.date} day={day} />}
        </>
      ) : null}
    </div>
  )
}
