export type CitizenAccount = {
  profile: { id: string; firstName: string | null; lastName: string | null; phone: string | null; address: string | null; district: string | null; preferredLanguage: string | null; registeredAt: string }
  email: string | null
  status: "active" | "suspended"
  canSuspend: boolean
}
export type CitizenAccounts = { items: CitizenAccount[]; canManage: boolean }
