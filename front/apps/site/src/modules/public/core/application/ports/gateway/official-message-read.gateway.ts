/** F73 : messages officiels marqués « J’ai lu » par la personne, mémorisés dans ce navigateur seulement. */
export interface OfficialMessageReadGateway {
  readIds(): Promise<string[]>
  /** Retourne la liste à jour. */
  markRead(id: string): Promise<string[]>
}
