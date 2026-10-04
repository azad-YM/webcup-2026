/** Jeton de la session en cours, fourni par le module auth (null si personne n’est connecté). */
export interface ParticipationSessionProvider {
  getToken(): string | null
}
