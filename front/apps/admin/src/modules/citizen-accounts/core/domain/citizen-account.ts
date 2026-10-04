export type CitizenAccount = {
  profile: { id: string; firstName: string | null; lastName: string | null; phone: string | null; address: string | null; district: string | null; preferredLanguage: string | null; registeredAt: string }
  email: string | null
  status: "active" | "suspended"
  canSuspend: boolean
  /** F70 : champs retirés par l’API (`email` partiel, `phone`, `address`) pour un agent non habilité ou sans affichage demandé. */
  maskedFields?: string[]
}
export type CitizenAccounts = { items: CitizenAccount[]; total: number; canManage: boolean; sensitive?: { revealed: boolean; canReveal: boolean } }
export type CitizenAccountsQuery = { search: string; reveal: boolean }
