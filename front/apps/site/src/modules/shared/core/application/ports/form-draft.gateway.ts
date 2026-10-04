/** Saisie d’un formulaire conservée sur l’appareil (L17, F59) : valeurs par nom de champ. */
export type FormDraft = { savedAt: number; fields: Record<string, string | boolean> }

/** Port : brouillons locaux des formulaires, pour ne pas perdre une saisie lors d’une panne réseau. */
export interface FormDraftGateway {
  read(key: string): FormDraft | null
  write(key: string, draft: FormDraft): void
  remove(key: string): void
  /** Oublie tous les brouillons (déconnexion : appareil éventuellement partagé). */
  clear(): void
}
