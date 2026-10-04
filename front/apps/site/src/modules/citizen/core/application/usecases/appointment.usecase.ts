import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Appointment, AppointmentChange, AppointmentOffer } from "../../domain/appointment"
import { requireToken } from "./notification.usecase"

const token = (dependencies: Parameters<UseCase<void, void>>[0]) => requireToken(dependencies.citizenSessionProvider.getToken())

export const getAppointmentOffer: UseCase<string | null, AppointmentOffer> = async (dependencies, serviceId) =>
  dependencies.appointmentGateway.offer(token(dependencies), serviceId)

export const listMyAppointments: UseCase<void, Appointment[]> = async (dependencies) =>
  dependencies.appointmentGateway.listMine(token(dependencies))

export const bookAppointment: UseCase<string, Appointment> = async (dependencies, slotId) =>
  dependencies.appointmentGateway.book(token(dependencies), slotId)

export const changeAppointment: UseCase<AppointmentChange, Appointment> = async (dependencies, change) =>
  dependencies.appointmentGateway.change(token(dependencies), change)
