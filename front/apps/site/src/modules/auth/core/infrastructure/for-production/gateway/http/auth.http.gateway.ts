import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { AccountSecurityGateway, AuthGateway } from "../../../../application/ports/gateway/auth.gateway"
import type {
  AccountSecurity,
  AuthSpace,
  AuthToken,
  ChangePasswordPayload,
  EmailVerificationPayload,
  LoginLinkRequested,
  LoginPayload,
  ReconfirmationCode,
  SignInResponse,
  VerifyCodePayload
} from "../../../../application/dto/auth.dto"
import { AuthError } from "@/modules/shared/core/lib/use-cases.decorator"

type ErrorPayload = { code?: string; retryAfter?: number; error?: string; message?: string }

const payloadOf = (error: ApiHttpError) => (error.payload ?? {}) as ErrorPayload

/** 429 de `/login_check` : verrouillage temporaire progressif (F37), durée fournie par l’API. */
function throttledMessage(error: ApiHttpError): string {
  const seconds = payloadOf(error).retryAfter
  if (typeof seconds !== "number" || seconds <= 0) return "Trop de tentatives de connexion. Réessayez dans quelques minutes."
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `Trop de tentatives de connexion. Par sécurité, la connexion est bloquée temporairement : réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`
}

/** Les refus de la connexion renforcée (L15) portent un `code` et un message français rédigé par IAM. */
function contractMessage(error: ApiHttpError): string | null {
  const payload = payloadOf(error)
  return typeof payload.code === "string" && typeof payload.error === "string" ? payload.error : null
}

export class AuthHttpGateway extends ApiClient implements AuthGateway, AccountSecurityGateway {
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try { return await request() } catch (error) {
      if (error instanceof ApiHttpError) {
        const code = payloadOf(error).code
        const details = typeof code === "string" ? { code } : {}
        if (error.status === 429 && code === "login_throttled") throw new AuthError(429, throttledMessage(error), details)
        const contract = contractMessage(error)
        if (contract && error.status !== 401) throw new AuthError(error.status, contract, details)
        throw new AuthError(error.status, error.status === 401
          ? "Adresse e-mail, mot de passe incorrect ou session expirée."
          : error.status === 429 ? throttledMessage(error)
          : error.status === 403 && code === "account_suspended" ? (payloadOf(error).error ?? "Votre compte est suspendu. Contactez la mairie.")
          : error.status === 403 ? "Vous n’avez pas accès à cet espace."
          : error.status === 422 || error.status === 400 ? "Les informations saisies ne sont pas valides. Vérifiez-les puis réessayez."
          : "Le service est indisponible. Réessayez.", details)
      }
      throw new AuthError("NETWORK_ERROR", "Impossible de joindre le service. Réessayez.")
    }
  }
  loginWithCredentials(payload: LoginPayload & { deviceId: string }): Promise<SignInResponse> {
    return this.execute(() => this.post<SignInResponse>("/login_check", payload))
  }
  listSpaces(token: string): Promise<AuthSpace[]> {
    return this.execute(() => this.get<AuthSpace[]>("/iam/me/spaces", ApiClient.authHeaders(token)))
  }
  issuePortalCode(token: string, challenge: string): Promise<{ code: string }> {
    return this.execute(() => this.post<{ code: string }>("/iam/portal-codes", { destination: "admin", challenge }, ApiClient.authHeaders(token)))
  }
  requestLoginLink(email: string): Promise<LoginLinkRequested> {
    return this.execute(() => this.post<LoginLinkRequested>("/iam/login-links", { email }))
  }
  consumeLoginLink(payload: { token: string; browserSecret: string; deviceId: string }): Promise<SignInResponse> {
    return this.execute(() => this.post<SignInResponse>("/iam/login-links/consume", payload))
  }
  verifySignInCode(payload: VerifyCodePayload): Promise<AuthToken> {
    return this.execute(() => this.post<AuthToken>("/iam/sign-in/verify", payload))
  }
  resendSignInCode(challengeId: string): Promise<{ expiresIn: number; remainingSends: number }> {
    return this.execute(() => this.post<{ expiresIn: number; remainingSends: number }>("/iam/sign-in/resend", { challengeId }))
  }
  getSecurity(token: string): Promise<AccountSecurity> {
    return this.execute(() => this.get<AccountSecurity>("/iam/me/security", ApiClient.authHeaders(token)))
  }
  sendReconfirmationCode(token: string): Promise<ReconfirmationCode> {
    return this.execute(() => this.post<ReconfirmationCode>("/iam/me/reconfirmation-codes", {}, ApiClient.authHeaders(token)))
  }
  setEmailVerification(token: string, payload: EmailVerificationPayload): Promise<{ emailVerificationEnabled: boolean }> {
    return this.execute(() => this.put<{ emailVerificationEnabled: boolean }>("/iam/me/email-verification", payload, ApiClient.authHeaders(token)))
  }
  reportDevice(token: string, deviceId: string): Promise<AuthToken> {
    return this.execute(() => this.post<AuthToken>("/iam/me/devices/report", { deviceId }, ApiClient.authHeaders(token)))
  }
  changePassword(token: string, payload: ChangePasswordPayload): Promise<AuthToken> {
    return this.execute(() => this.put<AuthToken>("/iam/me/password", payload, ApiClient.authHeaders(token)))
  }
}
