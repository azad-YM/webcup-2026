import { startPortalLogin, completePortalLogin } from "../usecases/portal-login.usecase"
import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import type {
  AuthProfile,
  AuthSpace,
} from "../dto/auth.dto"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import { getProfile } from "../usecases/get-profile.usecase"
import { listSpaces } from "../usecases/list-spaces.usecase"
import { logout } from "../usecases/logout.usecase"

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Profile"],
  endpoints: (build) => ({
    startPortalLogin: build.mutation<string, void>({ queryFn: withUseCase(startPortalLogin) }),
    completePortalLogin: build.mutation<void, { code: string; state: string }>({ queryFn: withUseCase(completePortalLogin) }),
    getProfile: build.query<AuthProfile | null, void>({
      queryFn: withUseCase(getProfile),
      providesTags: ["Profile"],
    }),
    listSpaces: build.query<AuthSpace[], void>({
      queryFn: withUseCase(listSpaces),
    }),
    logout: build.mutation<void, void>({
      queryFn: withUseCase(logout),
      invalidatesTags: ["Profile"],
    }),
  }),
})

export const {
  useStartPortalLoginMutation,
  useCompletePortalLoginMutation,
  useGetProfileQuery,
  useListSpacesQuery,
  useLogoutMutation,
} = authApi
