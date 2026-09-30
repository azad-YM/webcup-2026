import { issuePortalCode } from "../usecases/issue-portal-code.usecase"
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import {
  withUseCase,
  type QueryError
} from "@/modules/shared/core/lib/use-cases.decorator"
import { login } from "../usecases/login.usecase"
import { listSpaces } from "../usecases/list-spaces.usecase"
import type { AuthSpace, LoginPayload } from "../dto/auth.dto"
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  endpoints: (build) => ({
    issuePortalCode: build.mutation<{ code: string }, string>({ queryFn: withUseCase(issuePortalCode) }),
    loginWithCredentials: build.mutation<null, LoginPayload>({
      queryFn: withUseCase(login)
    }),
    listSpaces: build.query<AuthSpace[], void>({
      queryFn: withUseCase(listSpaces),
      keepUnusedDataFor: 0
    })
  })
})
export const { useLoginWithCredentialsMutation, useListSpacesQuery, useIssuePortalCodeMutation } = authApi
