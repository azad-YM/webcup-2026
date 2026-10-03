import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { CitizenProfile, CitizenProfileDraft } from "../../domain/citizen-profile"
import { activateMyCitizenAccount, getMyProfile, listDistricts, updateMyProfile } from "../usecases/my-profile.usecase"

import { deleteMyAccount } from "../usecases/delete-my-account.usecase"

export const citizenApi = createApi({
  reducerPath: "citizenApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["MyProfile"],
  endpoints: (build) => ({
    deleteMyAccount: build.mutation<{ deleted: boolean }, string>({ queryFn: withUseCase(deleteMyAccount) }),
    getMyProfile: build.query<CitizenProfile, void>({
      queryFn: withUseCase(getMyProfile),
      providesTags: ["MyProfile"]
    }),
    listDistricts: build.query<string[], void>({ queryFn: withUseCase(listDistricts), keepUnusedDataFor: 3600 }),
    // Le cache du profil est en erreur (404) : on le recharge plutôt que de le remplacer.
    activateMyCitizenAccount: build.mutation<CitizenProfile, void>({
      queryFn: withUseCase(activateMyCitizenAccount),
      invalidatesTags: ["MyProfile"]
    }),
    updateMyProfile: build.mutation<CitizenProfile, CitizenProfileDraft>({
      queryFn: withUseCase(updateMyProfile),
      // La réponse du PUT est le profil à jour : on remplace le cache sans nouvel appel.
      async onQueryStarted(_draft, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(citizenApi.util.updateQueryData("getMyProfile", undefined, () => data))
        } catch {
          /* L’erreur est affichée par le formulaire. */
        }
      }
    })
  })
})

export const { useDeleteMyAccountMutation, useListDistrictsQuery, useGetMyProfileQuery, useUpdateMyProfileMutation, useActivateMyCitizenAccountMutation } = citizenApi
