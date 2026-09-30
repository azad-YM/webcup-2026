import type { AccessSessionProvider } from "@/modules/example/core/application/ports/provider/access-session.provider"
import { ExampleError } from "@/modules/example/core/application/errors/example.error"
import type { AuthSessionGateway } from "../../../application/ports/gateway/auth-session.gateway"

/** Provider-side adapter: the auth module implements the session port of the example module. */
export class AuthExampleSessionProvider implements AccessSessionProvider {
  constructor(
    private readonly sessions: AuthSessionGateway,
    private readonly onInvalidated: () => void,
  ) {}

  async getToken(): Promise<string> {
    const token = this.sessions.getToken()
    if (!token) {
      this.invalidate()
      throw new ExampleError("unauthenticated", "Connectez-vous depuis le site pour continuer.")
    }
    return token
  }

  invalidate(): void {
    this.sessions.clear()
    this.onInvalidated()
  }
}
