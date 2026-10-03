import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import { listAuditEntries } from "../usecases/audit-journal.usecase"
import type { AuditFilters, AuditJournal } from "../../domain/audit-entry"

export const auditApi = createApi({
  reducerPath: "auditApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    auditEntries: build.query<AuditJournal, AuditFilters>({ queryFn: withUseCase(listAuditEntries) }),
  }),
})

export const { useAuditEntriesQuery } = auditApi
