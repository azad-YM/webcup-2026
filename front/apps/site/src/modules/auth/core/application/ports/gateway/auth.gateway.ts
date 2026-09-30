import type { AuthSpace, AuthToken, LoginPayload } from "../../dto/auth.dto"
export interface AuthGateway {
  loginWithCredentials(payload: LoginPayload): Promise<AuthToken>
  listSpaces(token: string): Promise<AuthSpace[]>
  issuePortalCode(token: string, challenge: string): Promise<{ code: string }>
}
