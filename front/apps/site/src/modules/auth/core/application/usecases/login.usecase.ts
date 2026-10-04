import { AuthError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import {
  SignInErrorCode,
  type LoginLinkRequested,
  type LoginPayload,
  type SignInResponse,
  type SignInResult,
  type VerifyCodePayload
} from "../dto/auth.dto"

/** Session ouverte (jeton enregistré) ou seconde étape demandée (F53). */
function settle(dependencies: Dependencies, response: SignInResponse): SignInResult {
  if ("token" in response) {
    dependencies.authSessionGateway.saveToken(response.token)
    return { status: "signed_in" }
  }
  const { challengeId, emailHint, expiresIn } = response
  return { status: "verification_required", verification: { challengeId, emailHint, expiresIn } }
}

export const login: UseCase<LoginPayload, SignInResult> = async (dependencies, payload) => {
  const deviceId = dependencies.deviceIdentityGateway.deviceId()
  return settle(dependencies, await dependencies.authGateway.loginWithCredentials({ ...payload, deviceId }))
}

/** D02 : la réponse est la même que le compte existe ou non ; le secret reste dans ce navigateur. */
export const requestLoginLink: UseCase<string, LoginLinkRequested> = async (dependencies, email) => {
  const requested = await dependencies.authGateway.requestLoginLink(email)
  dependencies.deviceIdentityGateway.saveLoginLinkSecret(requested.browserSecret, Date.now() + requested.expiresIn * 1000)
  return requested
}

/** D02 : jeton du lien + secret de ce navigateur. Sans secret, le lien a été ouvert ailleurs : message clair. */
export const consumeLoginLink: UseCase<string, SignInResult> = async (dependencies, token) => {
  const browserSecret = dependencies.deviceIdentityGateway.loginLinkSecret()
  if (!browserSecret) {
    throw new AuthError(403, "Ce lien doit être ouvert dans le navigateur où vous l’avez demandé, sur le même appareil. Si vous l’avez demandé ici, il a peut-être expiré : demandez un nouveau lien.", { code: SignInErrorCode.otherBrowser })
  }
  const deviceId = dependencies.deviceIdentityGateway.deviceId()
  const result = settle(dependencies, await dependencies.authGateway.consumeLoginLink({ token, browserSecret, deviceId }))
  dependencies.deviceIdentityGateway.clearLoginLinkSecret()
  return result
}

export const verifySignInCode: UseCase<VerifyCodePayload, null> = async (dependencies, payload) => {
  const { token } = await dependencies.authGateway.verifySignInCode(payload)
  dependencies.authSessionGateway.saveToken(token)
  return null
}

export const resendSignInCode: UseCase<string, { expiresIn: number; remainingSends: number }> = (dependencies, challengeId) =>
  dependencies.authGateway.resendSignInCode(challengeId)
