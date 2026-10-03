import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Appointment, AppointmentChange, AppointmentOffer } from "../../domain/appointment"
import { bookAppointment, changeAppointment, getAppointmentOffer, listMyAppointments } from "../usecases/appointment.usecase"
import { followRealtime } from "./follow-realtime"

/** Événement temps réel de Citizen sur `citizen.{citizenId}` : rendez-vous pris, déplacé ou annulé. */
export const APPOINTMENT_EVENTS = ["appointment.changed"] as const

export const APPOINTMENTS_POLLING_MS = 60_000

export const appointmentsApi = createApi({
  reducerPath: "citizenAppointmentsApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["Appointments", "Offer"],
  endpoints: (build) => ({
    getAppointmentOffer: build.query<AppointmentOffer, string | null>({
      queryFn: withUseCase(getAppointmentOffer),
      providesTags: ["Offer"]
    }),
    listMyAppointments: build.query<Appointment[], void>({
      queryFn: withUseCase(listMyAppointments),
      providesTags: ["Appointments"],
      onCacheEntryAdded: followRealtime(APPOINTMENT_EVENTS, (dispatch) => {
        dispatch(appointmentsApi.util.invalidateTags(["Appointments", "Offer"]))
      })
    }),
    bookAppointment: build.mutation<Appointment, string>({
      queryFn: withUseCase(bookAppointment),
      invalidatesTags: ["Appointments", "Offer"]
    }),
    changeAppointment: build.mutation<Appointment, AppointmentChange>({
      queryFn: withUseCase(changeAppointment),
      invalidatesTags: ["Appointments", "Offer"]
    })
  })
})

export const { useGetAppointmentOfferQuery, useListMyAppointmentsQuery, useBookAppointmentMutation, useChangeAppointmentMutation } = appointmentsApi
