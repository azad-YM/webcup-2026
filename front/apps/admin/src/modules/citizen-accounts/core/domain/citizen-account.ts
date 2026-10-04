export type CitizenAccount = {
  profile: { id: string; firstName: string | null; lastName: string | null; phone: string | null; address: string | null; district: string | null; preferredLanguage: string | null; registeredAt: string }
  email: string | null
  status: "active" | "suspended"
  canSuspend: boolean
}
export type CitizenAccounts = { items: CitizenAccount[]; total: number; canManage: boolean }

/** F71 : langues de la fiche d’accueil et de l’interface du site. */
export type ResidentLanguage = "fr" | "en" | "ar"
export const RESIDENT_LANGUAGES: Record<ResidentLanguage, string> = { fr: "Français", en: "Anglais (English)", ar: "Arabe (العربية)" }

export type WelcomeResidentInput = {
  firstName: string
  lastName: string
  preferredLanguage: ResidentLanguage
  phone: string | null
  email: string | null
}

/** Réponse de création : le code provisoire n’est renvoyé qu’une fois, pour la fiche imprimée. */
export type WelcomedResident = {
  citizenId: string
  residentId: string
  accessCode: string
  firstName: string | null
  lastName: string | null
  preferredLanguage: ResidentLanguage
  email: string | null
}
