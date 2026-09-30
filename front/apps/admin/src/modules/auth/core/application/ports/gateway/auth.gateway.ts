import type {
  AuthProfile,
  AuthSpace,
} from "../../dto/auth.dto"

export interface AuthGateway {
  getProfile: () => Promise<AuthProfile | null>
  listSpaces: () => Promise<AuthSpace[]>
}
