import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { RequestTracking, TrackingInput, WebcupFeed } from "../../domain/webcup-feed"
import { getWebcupFeed } from "../usecases/get-webcup-feed.usecase"
import { getSeenRequestCodes, markRequestsSeen } from "../usecases/seen-requests.usecase"
import { updateTracking } from "../usecases/update-tracking.usecase"
import { downloadReportFile, getActivityDashboard, getActivityReport, getServiceUsage } from "../usecases/get-activity-dashboard.usecase"
import type { ActivityReport, ReportPeriodChoice, ServiceUsageReport } from "../../domain/activity-report"
import type { ActivityDashboard } from "../../domain/activity-dashboard"
import type { ExportCatalog, ExportPreview, ExportRequest, ExportTemplate } from "../../domain/data-export"
import { deleteExportTemplate, downloadExport, getExportCatalog, getExportTemplates, previewExport, saveExportTemplate } from "../usecases/data-export.usecase"

/** The agents' page refreshes the feed every 30 s; the server itself keeps the API answer for 20 s. */
export const WEBCUP_FEED_POLLING_MS = 30_000
/** The activity dashboard (F50) refreshes every minute. */
export const ACTIVITY_POLLING_MS = 60_000

export const pilotageApi = createApi({
  reducerPath: "pilotageApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["ExportTemplate"],
  endpoints: (build) => ({
    getWebcupFeed: build.query<WebcupFeed, void>({
      queryFn: withUseCase(getWebcupFeed),
    }),
    getActivityDashboard: build.query<ActivityDashboard, void>({
      queryFn: withUseCase(getActivityDashboard),
    }),
    // F98 : services les plus utilisés ; F103 : rapport synthétique.
    getServiceUsage: build.query<ServiceUsageReport, ReportPeriodChoice>({ queryFn: withUseCase(getServiceUsage) }),
    getActivityReport: build.query<ActivityReport, ReportPeriodChoice>({ queryFn: withUseCase(getActivityReport) }),
    downloadReportFile: build.mutation<null, { fileName: string; mimeType: string; content: string }>({ queryFn: withUseCase(downloadReportFile) }),
    // F88 : écran « Exports ».
    getExportCatalog: build.query<ExportCatalog, void>({
      queryFn: withUseCase(getExportCatalog),
    }),
    previewExport: build.mutation<ExportPreview, ExportRequest>({
      queryFn: withUseCase(previewExport),
    }),
    downloadExport: build.mutation<{ rowCount: number; truncated: boolean }, ExportRequest>({
      queryFn: withUseCase(downloadExport),
    }),
    getExportTemplates: build.query<ExportTemplate[], void>({
      queryFn: withUseCase(getExportTemplates),
      providesTags: ["ExportTemplate"],
    }),
    saveExportTemplate: build.mutation<ExportTemplate[], ExportTemplate>({
      queryFn: withUseCase(saveExportTemplate),
      invalidatesTags: ["ExportTemplate"],
    }),
    deleteExportTemplate: build.mutation<ExportTemplate[], { name: string; dataset: string }>({
      queryFn: withUseCase(deleteExportTemplate),
      invalidatesTags: ["ExportTemplate"],
    }),
    getSeenRequestCodes: build.query<string[] | null, void>({
      queryFn: withUseCase(getSeenRequestCodes),
    }),
    markRequestsSeen: build.mutation<string[], string[]>({
      queryFn: withUseCase(markRequestsSeen),
    }),
    updateTracking: build.mutation<RequestTracking, { requestCode: string; input: TrackingInput }>({
      queryFn: withUseCase(updateTracking),
      // The saved tracking replaces the cached one at once; the next polling confirms it.
      async onQueryStarted({ requestCode }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(pilotageApi.util.updateQueryData("getWebcupFeed", undefined, feed => {
          const request = feed.requests.find(item => item.requestCode === requestCode)
          if (request) request.tracking = data
        }))
      },
    }),
  }),
})

export const { useGetWebcupFeedQuery, useGetSeenRequestCodesQuery, useMarkRequestsSeenMutation, useUpdateTrackingMutation, useGetActivityDashboardQuery,
  useGetExportCatalogQuery, usePreviewExportMutation, useDownloadExportMutation, useGetExportTemplatesQuery, useSaveExportTemplateMutation, useDeleteExportTemplateMutation,
  useGetServiceUsageQuery, useGetActivityReportQuery, useDownloadReportFileMutation } = pilotageApi
