/** Jeton de la session en cours, fourni par le module auth ; null sans session. */
export interface PublicSessionProvider {
  getToken(): string | null
}
