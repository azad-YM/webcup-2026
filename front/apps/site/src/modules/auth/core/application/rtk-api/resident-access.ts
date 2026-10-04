import { withUseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import { authApi } from "./auth"
import { changeMyCode, getAccountAccessStatus, loginAsResident } from "../usecases/resident-access.usecase"

/** F71 : endpoints ajoutés à `authApi` (pas de nouveau reducer). */
export const residentAccessApi = authApi.injectEndpoints({
  endpoints: (build) => ({
    loginAsResident: build.mutation<{ passwordChangeRequired: boolean }, { residentId: string; code: string }>({ queryFn: withUseCase(loginAsResident) }),
    accountAccessStatus: build.query<{ residentId: string | null; passwordChangeRequired: boolean }, void>({ queryFn: withUseCase(getAccountAccessStatus), keepUnusedDataFor: 0 }),
    changeMyCode: build.mutation<null, { currentPassword: string; newPassword: string }>({ queryFn: withUseCase(changeMyCode) })
  })
})

export const { useLoginAsResidentMutation, useAccountAccessStatusQuery, useChangeMyCodeMutation } = residentAccessApi
