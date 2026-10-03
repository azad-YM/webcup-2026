import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { AuthGateway } from "../../../../application/ports/gateway/auth.gateway"
import type { AuthSpace, AuthToken, LoginPayload } from "../../../../application/dto/auth.dto"
import { AuthError } from "@/modules/shared/core/lib/use-cases.decorator"

type ThrottlePayload = { code?: string; retryAfter?: number }

function hasCode(error: ApiHttpError, code: string): boolean {
  return (error.payload as ThrottlePayload | undefined)?.code === code
}

/** 429 de `/login_check` : verrouillage temporaire progressif (F37), durée fournie par l’API. */
function throttledMessage(error: ApiHttpError): string {
  const seconds = (error.payload as ThrottlePayload | undefined)?.retryAfter
  if (typeof seconds !== "number" || seconds <= 0) return "Trop de tentatives de connexion. Réessayez dans quelques minutes."
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `Trop de tentatives de connexion. Par sécurité, la connexion est bloquée temporairement : réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`
}

export class AuthHttpGateway extends ApiClient implements AuthGateway {
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try { return await request() } catch (error) {
      if (error instanceof ApiHttpError) {
        throw new AuthError(error.status, error.status === 401
          ? "Adresse e-mail, mot de passe incorrect ou session expirée."
          : error.status === 429 ? throttledMessage(error)
          : error.status === 403 && hasCode(error, "account_suspended") ? (error.payload?.error ?? "Votre compte est suspendu. Contactez la mairie.")
          : error.status === 403 ? "Vous n’avez pas accès à cet espace." : "Le service est indisponible. Réessayez.")
      }
      throw new AuthError("NETWORK_ERROR", "Impossible de joindre le service. Réessayez.")
    }
  }
  loginWithCredentials(payload: LoginPayload): Promise<AuthToken> {
    return this.execute(() => this.post<AuthToken>("/login_check", payload))
  }
  listSpaces(token: string): Promise<AuthSpace[]> {
    return this.execute(() => this.get<AuthSpace[]>("/iam/me/spaces", ApiClient.authHeaders(token)))
  }
  issuePortalCode(token: string, challenge: string): Promise<{ code: string }> {
    return this.execute(() => this.post<{ code: string }>("/iam/portal-codes", { destination: "admin", challenge }, ApiClient.authHeaders(token)))
  }
}
