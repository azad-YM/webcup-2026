import { ApiClient } from "@boilerplate/shared-utils/api-client"
import type { AuthSessionGateway } from "../../../../application/ports/gateway/auth-session.gateway"
import type { PortalLoginGateway } from "../../../../application/ports/gateway/portal-login.gateway"

const PENDING_KEY = "app.admin.portal-login"
const randomValue = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("")

export class PortalLoginHttpGateway extends ApiClient implements PortalLoginGateway {
  constructor(baseUrl: string, private readonly siteUrl: string, private readonly sessions: AuthSessionGateway) { super(baseUrl) }

  async start(): Promise<string> {
    const state = randomValue()
    const verifier = randomValue()
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ state, verifier, createdAt: Date.now() }))
    const target = new URL("sso/", `${this.siteUrl.replace(/\/$/, "")}/`)
    target.searchParams.set("destination", "admin")
    target.searchParams.set("challenge", challenge)
    target.searchParams.set("state", state)
    return target.href
  }

  async complete(code: string, state: string): Promise<void> {
    const raw = window.sessionStorage.getItem(PENDING_KEY)
    if (!raw) throw new Error("La demande de connexion est introuvable. Recommencez depuis le site.")
    const pending = JSON.parse(raw) as { state: string; verifier: string; createdAt: number }
    if (!state || state !== pending.state || !/^[a-f0-9]{64}$/.test(code) || !/^[a-f0-9]{64}$/.test(pending.verifier) || !Number.isFinite(pending.createdAt) || Date.now() - pending.createdAt > 300_000 || pending.createdAt > Date.now()) {
      throw new Error("La demande de connexion est invalide ou expirée. Recommencez depuis le site.")
    }
    const result = await this.post<{ token: string }>("/iam/portal-sessions", { code, destination: "admin", verifier: pending.verifier })
    if (!result?.token) throw new Error("La connexion n’a pas abouti. Recommencez depuis le site.")
    this.sessions.saveToken(result.token)
    window.sessionStorage.removeItem(PENDING_KEY)
  }
}
