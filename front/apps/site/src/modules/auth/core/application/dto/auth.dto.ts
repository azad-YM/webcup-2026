export type LoginPayload = { email: string; password: string }
export type RegistrationPayload = { email: string; password: string }
export type AuthToken = { token: string }

/** L15 — seconde étape de connexion (F53) : un code à 6 chiffres a été envoyé par e-mail. */
export type SignInVerification = { challengeId: string; emailHint: string; expiresIn: number }
/** Réponse de `/login_check` et de `/iam/login-links/consume` : session ouverte ou code demandé. */
export type SignInResponse = AuthToken | ({ verificationRequired: true } & SignInVerification)
export type SignInResult = { status: "signed_in" } | { status: "verification_required"; verification: SignInVerification }
export type VerifyCodePayload = { challengeId: string; code: string; trustDevice: boolean }
export type LoginLinkRequested = { browserSecret: string; expiresIn: number }

/** « Sécurité du compte » (F53, F54) : contrat `GET /api/iam/me/security`. */
export type KnownDevice = {
  id: string
  label: string
  firstSeenAt: string
  lastUsedAt: string
  trusted: boolean
  trustedUntil: string | null
  current: boolean
}
export type SignInEvent = { at: string; method: "password" | "link"; deviceLabel: string; secondFactor: boolean; ip: string }
export type AccountSecurity = {
  emailHint: string | null
  emailAvailable: boolean
  emailVerificationEnabled: boolean
  devices: KnownDevice[]
  recentSignIns: SignInEvent[]
}
/** Code de confirmation d'identité envoyé par e-mail (activer la vérification, exporter ses données). */
export type ReconfirmationCode = { challengeId: string; emailHint: string; expiresIn: number }
export type Reconfirmation = { password?: string; challengeId?: string; code?: string }
export type EmailVerificationPayload = { enabled: boolean } & Reconfirmation
export type ChangePasswordPayload = { currentPassword: string; newPassword: string }

/** Codes d'erreur contractuels de la connexion renforcée, exposés dans `QueryError.code`. */
export const SignInErrorCode = {
  /** Lien ouvert dans un autre navigateur que celui de la demande (secret absent ou différent). */
  otherBrowser: "other_browser",
  linkInvalid: "link_invalid",
  challengeExpired: "challenge_expired",
  invalidCode: "invalid_code",
  tooManyAttempts: "too_many_attempts"
} as const
/** Codes returned by IAM `/iam/me/spaces`. Add a code here when a new application joins the SSO. */
export type SpaceCode = "admin"
export type AuthSpace = { code: SpaceCode; name: string; description: string; roles: string[] }

/** Codes d’erreur contractuels de l’inscription, exposés dans `QueryError.code`. */
export const RegistrationErrorCode = {
  /** E-mail déjà utilisé (409) : inviter à se connecter. */
  accountAlreadyExists: "ACCOUNT_ALREADY_EXISTS",
  /** Saisie refusée par le serveur (422). */
  invalidRegistration: "INVALID_REGISTRATION",
  /** Compte créé mais connexion automatique impossible : inviter à se connecter. */
  createdButNotSignedIn: "CREATED_BUT_NOT_SIGNED_IN"
} as const
