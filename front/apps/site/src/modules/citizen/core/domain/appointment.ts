/** Rendez-vous (L10 : F39, F40) : contrat de Citizen, voir `api/src/Citizen/doc/rendez-vous.md`. */
export type AppointmentSlot = {
  id: string
  serviceId: string
  serviceName: string
  /** ISO 8601 avec le décalage du fuseau de la ville. */
  startsAt: string
  endsAt: string
  durationMinutes: number
  location: string
  instructions: string
  timezone: string
  timezoneLabel: string
  /** Phrase prête à afficher, ex. « lundi 12 octobre 2026 à 9 h 30 ». */
  when: string
  booked: boolean
}

/**
 * F63/F64 : état du service lu par Citizen dans le catalogue d'Administration. `disabled` : désactivé par la mairie,
 * aucune réservation possible (créneaux non proposés, 409 sinon) ; `disrupted` : maintenance ou incident, réservation possible.
 */
export type ServiceAvailability = {
  state: "available" | "disrupted" | "disabled"
  disabled: boolean
  status: "available" | "maintenance" | "incident"
  message: string
  alternative: string
  returnAt: string | null
  place: string
  hours: string
  phone: string | null
}

export type AppointmentServiceOffer = { serviceId: string; serviceName: string; openSlots: number; nextWhen: string; availability?: ServiceAvailability | null }

export type AppointmentOffer = {
  services: AppointmentServiceOffer[]
  slots: AppointmentSlot[]
  /** État du service choisi (`?serviceId=`), même sans créneau ouvert. */
  selectedAvailability?: ServiceAvailability | null
  timezone: string
  timezoneLabel: string
}

export type AppointmentStatus = "confirmed" | "cancelled"

export type Appointment = {
  id: string
  reference: string
  status: AppointmentStatus
  serviceId: string
  serviceName: string
  startsAt: string
  endsAt: string
  durationMinutes: number
  location: string
  instructions: string
  timezone: string
  timezoneLabel: string
  when: string
  canChange: boolean
  createdAt: string
  updatedAt: string
}

/** `slotId` null : annuler le rendez-vous. */
export type AppointmentChange = { appointmentId: string; slotId: string | null }

/** Heure locale de la ville (« 09:30 »), lue dans la chaîne ISO : indépendante du fuseau du navigateur. */
export const localTime = (iso: string) => iso.slice(11, 16).replace(":", " h ")

/** Jour local de la ville (« 2026-10-12 »), clé de regroupement des créneaux. */
export const localDay = (iso: string) => iso.slice(0, 10)

/** « lundi 12 octobre 2026 » à partir d'un créneau (la phrase `when` vient de l'API). */
export const dayLabel = (slot: { when: string }) => slot.when.replace(/ à .*$/, "")

export const isUpcoming = (appointment: Appointment) => appointment.status === "confirmed" && appointment.canChange
