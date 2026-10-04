/** Auth consomme uniquement l’existence de l’espace citoyen du compte courant. */
export interface CitizenWorkspaceProvider {
  isAvailable(): Promise<boolean>
}

export class CitizenWorkspaceUnavailableError extends Error {
  constructor() {
    super("Impossible de vérifier votre espace citoyen. Réessayez.")
    this.name = "CitizenWorkspaceUnavailableError"
  }
}
