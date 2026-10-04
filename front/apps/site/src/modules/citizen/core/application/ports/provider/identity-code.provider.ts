/**
 * F55 — envoi d’un code de confirmation d’identité par e-mail, pour un citoyen qui préfère ne pas saisir son
 * mot de passe. Fourni par le module auth (`auth/core/infrastructure/adapter/citizen`), qui appelle IAM
 * (`POST /api/iam/me/reconfirmation-codes`).
 */
export interface IdentityCodeProvider {
  sendCode(): Promise<{ challengeId: string; emailHint: string; expiresIn: number }>
}
