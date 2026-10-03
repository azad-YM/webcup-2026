import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import { listLoginSecurityEvents } from "../usecases/security-journal.usecase"
import type { LoginSecurityJournal } from "../../domain/login-security-event"
export const securityApi = createApi({
  reducerPath: "securityApi", baseQuery: fakeBaseQuery(), tagTypes: ["LoginEvents"],
  endpoints: (build) => ({
    loginEvents: build.query<LoginSecurityJournal, string>({ queryFn: withUseCase(listLoginSecurityEvents), providesTags: ["LoginEvents"] }),
  }),
})
export const { useLoginEventsQuery } = securityApi
