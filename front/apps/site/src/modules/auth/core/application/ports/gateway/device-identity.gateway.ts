/**
 * Mémoire du navigateur pour la connexion renforcée (L15).
 *
 * - `deviceId()` : identifiant aléatoire de cet appareil, créé une fois et gardé (F54, confiance 30 jours F53).
 * - Secret de navigateur du lien de connexion (D02) : gardé jusqu’à son expiration (10 minutes) et effacé après
 *   usage. Il est conservé dans le stockage local plutôt que de session : le lien reçu par e-mail s’ouvre dans un
 *   **nouvel onglet**, qui ne partage pas le stockage de session de l’onglet de la demande.
 */
export interface DeviceIdentityGateway {
  deviceId(): string
  saveLoginLinkSecret(secret: string, expiresAt: number): void
  /** Secret encore valable, sinon null. */
  loginLinkSecret(): string | null
  clearLoginLinkSecret(): void
}
