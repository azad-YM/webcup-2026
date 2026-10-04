import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import { listCitizenAccounts, setCitizenSuspension, welcomeResident } from "../usecases/accounts.usecase"
import type { CitizenAccounts, CitizenAccountsQuery, WelcomedResident, WelcomeResidentInput } from "../../domain/citizen-account"
export const citizenAccountsApi = createApi({
  reducerPath: "citizenAccountsApi", baseQuery: fakeBaseQuery(), tagTypes: ["Accounts"],
  endpoints: (build) => ({
    list: build.query<CitizenAccounts, CitizenAccountsQuery>({ queryFn: withUseCase(listCitizenAccounts), providesTags: ["Accounts"] }),
    suspend: build.mutation<{ id: string; status: string }, { citizenId: string; suspended: boolean }>({ queryFn: withUseCase(setCitizenSuspension), invalidatesTags: ["Accounts"] }),
    welcome: build.mutation<WelcomedResident, WelcomeResidentInput>({ queryFn: withUseCase(welcomeResident), invalidatesTags: ["Accounts"] }),
  }),
})
export const { useListQuery, useSuspendMutation, useWelcomeMutation } = citizenAccountsApi
