import type { AuthSessionGateway } from "@/modules/auth/core/application/ports/gateway/auth-session.gateway"

export const SESSION_STORAGE_KEY = "app.admin.session"

export class AuthSessionLocalStorageGateway implements AuthSessionGateway {
  getToken(): string | null {
    if (typeof window === "undefined") {
      return null
    }

    return window.localStorage.getItem(SESSION_STORAGE_KEY)
  }

  saveToken(token: string): void {
    window.localStorage.setItem(SESSION_STORAGE_KEY, token)
  }

  clear(): void {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
