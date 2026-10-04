import { issuePortalCode } from "../usecases/issue-portal-code.usecase"
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import {
  withUseCase,
  type QueryError
} from "@/modules/shared/core/lib/use-cases.decorator"
import { consumeLoginLink, login, requestLoginLink, resendSignInCode, verifySignInCode } from "../usecases/login.usecase"
import { listSpaces } from "../usecases/list-spaces.usecase"
import { register } from "../usecases/register.usecase"
import { changePassword, getAccountSecurity, reportDevice, sendReconfirmationCode, setEmailVerification } from "../usecases/account-security.usecase"
import type {
  AccountSecurity,
  AuthSpace,
  ChangePasswordPayload,
  EmailVerificationPayload,
  LoginLinkRequested,
  LoginPayload,
  ReconfirmationCode,
  RegistrationPayload,
  SignInResult,
  VerifyCodePayload
} from "../dto/auth.dto"
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ["AccountSecurity"],
  endpoints: (build) => ({
    issuePortalCode: build.mutation<{ code: string }, string>({ queryFn: withUseCase(issuePortalCode) }),
    loginWithCredentials: build.mutation<SignInResult, LoginPayload>({
      queryFn: withUseCase(login)
    }),
    registerAccount: build.mutation<null, RegistrationPayload>({
      queryFn: withUseCase(register)
    }),
    listSpaces: build.query<AuthSpace[], void>({
      queryFn: withUseCase(listSpaces),
      keepUnusedDataFor: 0
    }),
    // L15 — connexion sans mot de passe (D02), seconde étape (F53).
    requestLoginLink: build.mutation<LoginLinkRequested, string>({ queryFn: withUseCase(requestLoginLink) }),
    consumeLoginLink: build.mutation<SignInResult, string>({ queryFn: withUseCase(consumeLoginLink) }),
    verifySignInCode: build.mutation<null, VerifyCodePayload>({ queryFn: withUseCase(verifySignInCode) }),
    resendSignInCode: build.mutation<{ expiresIn: number; remainingSends: number }, string>({ queryFn: withUseCase(resendSignInCode) }),
    // « Sécurité du compte » (F53, F54).
    getAccountSecurity: build.query<AccountSecurity, void>({ queryFn: withUseCase(getAccountSecurity), providesTags: ["AccountSecurity"] }),
    sendReconfirmationCode: build.mutation<ReconfirmationCode, void>({ queryFn: withUseCase(sendReconfirmationCode) }),
    setEmailVerification: build.mutation<{ emailVerificationEnabled: boolean }, EmailVerificationPayload>({
      queryFn: withUseCase(setEmailVerification),
      invalidatesTags: ["AccountSecurity"]
    }),
    reportDevice: build.mutation<null, string>({ queryFn: withUseCase(reportDevice), invalidatesTags: ["AccountSecurity"] }),
    changePassword: build.mutation<null, ChangePasswordPayload>({ queryFn: withUseCase(changePassword), invalidatesTags: ["AccountSecurity"] })
  })
})
export const {
  useLoginWithCredentialsMutation,
  useRegisterAccountMutation,
  useListSpacesQuery,
  useIssuePortalCodeMutation,
  useRequestLoginLinkMutation,
  useConsumeLoginLinkMutation,
  useVerifySignInCodeMutation,
  useResendSignInCodeMutation,
  useGetAccountSecurityQuery,
  useSendReconfirmationCodeMutation,
  useSetEmailVerificationMutation,
  useReportDeviceMutation,
  useChangePasswordMutation
} = authApi
