import type { DeviceIdentityGateway } from "../../../application/ports/gateway/device-identity.gateway"
import { AuthError } from "@/modules/shared/core/lib/use-cases.decorator"

const DEVICE_KEY = "app.site.device-id"
const LINK_SECRET_KEY = "app.site.login-link"

function randomId(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function storageError(): AuthError {
  return new AuthError("CLIENT_ERROR", "Le stockage du navigateur est indisponible. Autorisez-le pour vous connecter.")
}

export class LocalStorageDeviceIdentityGateway implements DeviceIdentityGateway {
  deviceId(): string {
    try {
      const existing = window.localStorage.getItem(DEVICE_KEY)
      if (existing && /^[A-Za-z0-9_-]{16,128}$/.test(existing)) return existing
      const created = randomId()
      window.localStorage.setItem(DEVICE_KEY, created)
      return created
    } catch {
      throw storageError()
    }
  }

  saveLoginLinkSecret(secret: string, expiresAt: number): void {
    try {
      window.localStorage.setItem(LINK_SECRET_KEY, JSON.stringify({ secret, expiresAt }))
    } catch {
      throw storageError()
    }
  }

  loginLinkSecret(): string | null {
    try {
      const raw = window.localStorage.getItem(LINK_SECRET_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { secret?: unknown; expiresAt?: unknown }
      if (typeof parsed.secret !== "string" || typeof parsed.expiresAt !== "number" || parsed.expiresAt < Date.now()) {
        window.localStorage.removeItem(LINK_SECRET_KEY)
        return null
      }
      return parsed.secret
    } catch {
      return null
    }
  }

  clearLoginLinkSecret(): void {
    try {
      window.localStorage.removeItem(LINK_SECRET_KEY)
    } catch {
      /* Rien à effacer si le stockage est indisponible. */
    }
  }
}
