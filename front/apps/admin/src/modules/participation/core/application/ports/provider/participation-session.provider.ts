/** Session de l’agent, fournie par le module auth. */
export interface ParticipationSessionProvider {
  getToken(): Promise<string>
  invalidate(): void
}
