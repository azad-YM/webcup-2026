import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { AppError, withUseCase, type QueryError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { IdentityProof, PersonalDataExport } from "../../domain/personal-data"
import { requireToken } from "../usecases/notification.usecase"

/** F55 : l’export exige une confirmation d’identité (mot de passe ou code e-mail). */
const exportMyData: UseCase<IdentityProof, PersonalDataExport> = async (dependencies, proof) => {
  const token = requireToken(dependencies.citizenSessionProvider.getToken())
  if ("password" in proof && !proof.password) throw new AppError(422, "Saisissez votre mot de passe pour confirmer.")
  if ("code" in proof && !/^\d{6}$/.test(proof.code)) throw new AppError(422, "Le code comporte 6 chiffres.")
  return dependencies.personalDataGateway.export(token, proof)
}

const sendIdentityCode: UseCase<void, { challengeId: string; emailHint: string; expiresIn: number }> = (dependencies) =>
  dependencies.identityCodeProvider.sendCode()

export const personalDataApi = createApi({
  reducerPath: "citizenPersonalDataApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  endpoints: (build) => ({
    exportMyData: build.mutation<PersonalDataExport, IdentityProof>({ queryFn: withUseCase(exportMyData) }),
    sendIdentityCode: build.mutation<{ challengeId: string; emailHint: string; expiresIn: number }, void>({ queryFn: withUseCase(sendIdentityCode) })
  })
})

export const { useExportMyDataMutation, useSendIdentityCodeMutation } = personalDataApi
