import { withUseCase, type UseCase } from "@/modules/shared/core/config/use-cases"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { AppointmentDay, SlotSeries } from "../../domain/agent-desk"
import { requestsApi } from "./requests"

/** Événements Citizen sur `administration.requests` qui changent le guichet. */
export const DESK_EVENTS = ["appointment.changed"] as const

export const DESK_POLLING_MS = 60_000

const appointmentDay: UseCase<string, AppointmentDay> = async (_dispatch, _getState, dependencies, date) =>
  dependencies.agentDeskGateway.appointmentDay(date)

const openSlots: UseCase<SlotSeries, null> = async (_dispatch, _getState, dependencies, series) => {
  await dependencies.agentDeskGateway.openSlots(series)
  return null
}

const removeSlot: UseCase<string, null> = async (_dispatch, _getState, dependencies, slotId) => {
  await dependencies.agentDeskGateway.removeSlot(slotId)
  return null
}

/** Endpoints du guichet injectés dans l'API RTK du module (même cache et même nettoyage de session). */
export const agentDeskApi = requestsApi.enhanceEndpoints({ addTagTypes: ["AppointmentDay"] }).injectEndpoints({
  endpoints: (build) => ({
    appointmentDay: build.query<AppointmentDay, string>({
      queryFn: withUseCase(appointmentDay),
      providesTags: ["AppointmentDay"],
      async onCacheEntryAdded(_date, { extra, dispatch, cacheDataLoaded, cacheEntryRemoved }) {
        let unsubscribe: () => void = () => undefined
        try {
          await cacheDataLoaded
          unsubscribe = (extra as Dependencies).realtime.subscribe(DESK_EVENTS, () => {
            dispatch(agentDeskApi.util.invalidateTags(["AppointmentDay"]))
          })
        } catch {
          /* Failed load: polling and "Réessayer" take over. */
        }
        await cacheEntryRemoved
        unsubscribe()
      },
    }),
    openSlots: build.mutation<null, SlotSeries>({
      queryFn: withUseCase(openSlots),
      invalidatesTags: ["AppointmentDay"],
    }),
    removeSlot: build.mutation<null, string>({
      queryFn: withUseCase(removeSlot),
      invalidatesTags: ["AppointmentDay"],
    }),
  }),
})

export const { useAppointmentDayQuery, useOpenSlotsMutation, useRemoveSlotMutation } = agentDeskApi
