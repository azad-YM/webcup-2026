export type LoginPayload = { email: string; password: string }
export type RegistrationPayload = { email: string; password: string }
export type AuthToken = { token: string }
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
