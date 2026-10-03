/** Rendez-vous vus par les agents (Citizen L10) — contrat `api/src/Citizen/doc/rendez-vous.md`. */
export type DaySlot = {
  id: string
  serviceId: string
  serviceName: string
  startsAt: string
  endsAt: string
  durationMinutes: number
  location: string
  instructions: string
  when: string
  booked: boolean
  appointment: { id: string; reference: string; status: "confirmed" | "cancelled"; citizenName: string; citizenPhone: string | null } | null
}

export type AppointmentDay = {
  date: string
  timezone: string
  timezoneLabel: string
  items: DaySlot[]
  bookedCount: number
  canManage: boolean
  services: { id: string; name: string; place: string }[]
}

export type SlotSeries = {
  serviceId: string
  date: string
  startTime: string
  durationMinutes: number
  count: number
  location: string | null
  instructions: string | null
}

/** Heure locale de la ville lue dans la chaîne ISO (indépendante du fuseau du navigateur). */
export const localTime = (iso: string) => iso.slice(11, 16)

/** Date locale du jour au format `YYYY-MM-DD` dans le fuseau de la ville (La Réunion). */
export const cityToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Reunion" }).format(new Date())
