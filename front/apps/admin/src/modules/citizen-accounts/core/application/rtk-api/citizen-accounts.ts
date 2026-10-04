import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import { listCitizenAccounts, setCitizenSuspension } from "../usecases/accounts.usecase"
import type { CitizenAccounts, CitizenAccountsQuery } from "../../domain/citizen-account"
export const citizenAccountsApi = createApi({
  reducerPath: "citizenAccountsApi", baseQuery: fakeBaseQuery(), tagTypes: ["Accounts"],
  endpoints: (build) => ({
    list: build.query<CitizenAccounts, CitizenAccountsQuery>({ queryFn: withUseCase(listCitizenAccounts), providesTags: ["Accounts"] }),
    suspend: build.mutation<{ id: string; status: string }, { citizenId: string; suspended: boolean }>({ queryFn: withUseCase(setCitizenSuspension), invalidatesTags: ["Accounts"] }),
  }),
})
export const { useListQuery, useSuspendMutation } = citizenAccountsApi
