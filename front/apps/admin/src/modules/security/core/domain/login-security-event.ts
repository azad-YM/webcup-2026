/** Entrée du journal IAM écrite lorsqu’une série d’échecs de connexion déclenche un verrouillage temporaire (F37). */
export type LoginSecurityEvent = {
  id: string
  occurredAt: string
  /** pair : un compte depuis une adresse IP ; account : un compte depuis plusieurs IP ; ip : une IP sur plusieurs comptes. */
  scope: "pair" | "account" | "ip"
  email: string | null
  ip: string
  failures: number
  lockedSeconds: number
}
export type LoginSecurityJournal = { items: LoginSecurityEvent[] }

export const scopeLabel: Record<LoginSecurityEvent["scope"], string> = {
  pair: "Compte ciblé depuis une même adresse",
  account: "Compte ciblé depuis plusieurs adresses",
  ip: "Adresse essayant plusieurs comptes",
}
