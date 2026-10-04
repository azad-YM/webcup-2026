import { withUseCase, type UseCase } from "@/modules/shared/core/config/use-cases"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type { AppointmentDay, AppointmentDayQuery, ConcernHandling, ConcernQueue, ConcernStatus, SlotSeries } from "../../domain/agent-desk"
import { requestsApi } from "./requests"

/** Événements Citizen sur `administration.requests` qui changent le guichet. */
export const DESK_EVENTS = ["appointment.changed"] as const

export const DESK_POLLING_MS = 60_000

const appointmentDay: UseCase<AppointmentDayQuery, AppointmentDay> = async (_dispatch, _getState, dependencies, query) =>
  dependencies.agentDeskGateway.appointmentDay(query.date, query.reveal)

const openSlots: UseCase<SlotSeries, null> = async (_dispatch, _getState, dependencies, series) => {
  await dependencies.agentDeskGateway.openSlots(series)
  return null
}

const removeSlot: UseCase<string, null> = async (_dispatch, _getState, dependencies, slotId) => {
  await dependencies.agentDeskGateway.removeSlot(slotId)
  return null
}

const concernQueue: UseCase<ConcernStatus | null, ConcernQueue> = async (_dispatch, _getState, dependencies, status) =>
  dependencies.agentDeskGateway.concernQueue(status)

const handleConcern: UseCase<ConcernHandling, null> = async (_dispatch, _getState, dependencies, handling) => {
  await dependencies.agentDeskGateway.handleConcern(handling)
  return null
}

/** Endpoints du guichet injectés dans l'API RTK du module (même cache et même nettoyage de session). */
export const agentDeskApi = requestsApi.enhanceEndpoints({ addTagTypes: ["AppointmentDay", "Concerns"] }).injectEndpoints({
  endpoints: (build) => ({
    appointmentDay: build.query<AppointmentDay, AppointmentDayQuery>({
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
    concernQueue: build.query<ConcernQueue, ConcernStatus | null>({
      queryFn: withUseCase(concernQueue),
      providesTags: ["Concerns"],
    }),
    handleConcern: build.mutation<null, ConcernHandling>({
      queryFn: withUseCase(handleConcern),
      invalidatesTags: ["Concerns"],
    }),
  }),
})

export const { useAppointmentDayQuery, useOpenSlotsMutation, useRemoveSlotMutation, useConcernQueueQuery, useHandleConcernMutation } = agentDeskApi
