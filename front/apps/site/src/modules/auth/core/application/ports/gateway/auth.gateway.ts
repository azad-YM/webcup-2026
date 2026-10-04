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
} from "../../dto/auth.dto"

/**
 * Port vers IAM. Erreurs : `AuthError` avec le statut HTTP, un message français affichable
 * et `details.code` pris dans `SignInErrorCode` quand l’API en fournit un.
 */
export interface AuthGateway {
  /** `deviceId` : identifiant aléatoire de cet appareil (F54), jamais transmis dans une URL. */
  loginWithCredentials(payload: LoginPayload & { deviceId: string }): Promise<SignInResponse>
  listSpaces(token: string): Promise<AuthSpace[]>
  issuePortalCode(token: string, challenge: string): Promise<{ code: string }>
  // Connexion sans mot de passe (D02) et seconde étape (F53).
  requestLoginLink(email: string): Promise<LoginLinkRequested>
  consumeLoginLink(payload: { token: string; browserSecret: string; deviceId: string }): Promise<SignInResponse>
  verifySignInCode(payload: VerifyCodePayload): Promise<AuthToken>
  resendSignInCode(challengeId: string): Promise<{ expiresIn: number; remainingSends: number }>
}

/** « Sécurité du compte » (F53, F54) : appels authentifiés d’IAM. */
export interface AccountSecurityGateway {
  getSecurity(token: string): Promise<AccountSecurity>
  sendReconfirmationCode(token: string): Promise<ReconfirmationCode>
  setEmailVerification(token: string, payload: EmailVerificationPayload): Promise<{ emailVerificationEnabled: boolean }>
  /** « Ce n’était pas moi » : toutes les sessions sont fermées, une nouvelle session est rendue à cet appareil. */
  reportDevice(token: string, deviceId: string): Promise<AuthToken>
  changePassword(token: string, payload: ChangePasswordPayload): Promise<AuthToken>
}
