import type { AuthGateway } from "@/modules/auth/core/application/ports/gateway/auth.gateway"
import type { AuthSessionGateway } from "@/modules/auth/core/application/ports/gateway/auth-session.gateway"
export type Dependencies = {
  authGateway: AuthGateway
  authSessionGateway: AuthSessionGateway
}
