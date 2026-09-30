import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"
import { AuthError } from "@/modules/shared/core/lib/use-cases.decorator"
export const SESSION_KEY = "app.site.jwt"
export class LocalStorageAuthSessionGateway implements AuthSessionGateway {
  getToken() {
    return window.localStorage.getItem(SESSION_KEY)
  }
  saveToken(token: string) {
    try {
      window.localStorage.setItem(SESSION_KEY, token)
    } catch {
      throw new AuthError(
        "CLIENT_ERROR",
        "Le stockage du navigateur est indisponible. Autorisez-le pour vous connecter."
      )
    }
  }
  clear() {
    window.localStorage.removeItem(SESSION_KEY)
  }
}
