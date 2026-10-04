import { withUseCase, type UseCase } from "@/modules/shared/core/config/use-cases"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import { securityApi } from "./security"
import { SECURITY_EVENTS, type Anomaly, type AnomalyBoard, type AnomalyFilters, type AnomalyStatus, type AnomalySummary, type BackupBoard, type PlatformStatus, type ScanResult } from "../../domain/operations"

const anomalies: UseCase<AnomalyFilters, AnomalyBoard> = async (_d, _g, dependencies, filters) => dependencies.operationsGateway.anomalies(filters)
const scan: UseCase<void, ScanResult> = async (_d, _g, dependencies) => dependencies.operationsGateway.scan()
const changeStatus: UseCase<{ id: string; status: AnomalyStatus }, Anomaly> = async (_d, _g, dependencies, input) => dependencies.operationsGateway.changeStatus(input.id, input.status)
const summary: UseCase<void, AnomalySummary> = async (_d, _g, dependencies) => dependencies.operationsGateway.summary()
const backups: UseCase<void, BackupBoard> = async (_d, _g, dependencies) => dependencies.operationsGateway.backups()
const platformStatus: UseCase<void, PlatformStatus> = async (_d, _g, dependencies) => dependencies.operationsGateway.platformStatus()

/** F85, F87, F77 : endpoints injectés dans l'API RTK du module sécurité (même cache, même nettoyage de session). */
export const operationsApi = securityApi.enhanceEndpoints({ addTagTypes: ["Anomalies", "AnomalySummary", "Backups", "Platform"] }).injectEndpoints({
  endpoints: (build) => ({
    anomalies: build.query<AnomalyBoard, AnomalyFilters>({
      queryFn: withUseCase(anomalies),
      providesTags: ["Anomalies"],
      async onCacheEntryAdded(_filters, { extra, dispatch, cacheDataLoaded, cacheEntryRemoved }) {
        let unsubscribe: () => void = () => undefined
        try {
          await cacheDataLoaded
          unsubscribe = (extra as Dependencies).realtime.subscribe(SECURITY_EVENTS, () => {
            dispatch(operationsApi.util.invalidateTags(["Anomalies", "AnomalySummary"]))
          })
        } catch {
          /* Chargement échoué : l'actualisation périodique et « Réessayer » prennent le relais. */
        }
        await cacheEntryRemoved
        unsubscribe()
      },
    }),
    scanAnomalies: build.mutation<ScanResult, void>({ queryFn: withUseCase(scan), invalidatesTags: ["Anomalies", "AnomalySummary"] }),
    changeAnomalyStatus: build.mutation<Anomaly, { id: string; status: AnomalyStatus }>({ queryFn: withUseCase(changeStatus), invalidatesTags: ["Anomalies", "AnomalySummary"] }),
    anomalySummary: build.query<AnomalySummary, void>({ queryFn: withUseCase(summary), providesTags: ["AnomalySummary"] }),
    backups: build.query<BackupBoard, void>({ queryFn: withUseCase(backups), providesTags: ["Backups"] }),
    platformStatus: build.query<PlatformStatus, void>({ queryFn: withUseCase(platformStatus), providesTags: ["Platform"] }),
  }),
})

export const {
  useAnomaliesQuery,
  useScanAnomaliesMutation,
  useChangeAnomalyStatusMutation,
  useAnomalySummaryQuery,
  useBackupsQuery,
  usePlatformStatusQuery,
} = operationsApi
