import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { CitizenProfile, CitizenProfileDraft } from "../../domain/citizen-profile"
import { getMyProfile, updateMyProfile } from "../usecases/my-profile.usecase"

export const citizenApi = createApi({
  reducerPath: "citizenApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["MyProfile"],
  endpoints: (build) => ({
    getMyProfile: build.query<CitizenProfile, void>({
      queryFn: withUseCase(getMyProfile),
      providesTags: ["MyProfile"]
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

export const { useGetMyProfileQuery, useUpdateMyProfileMutation } = citizenApi
