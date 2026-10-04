/** Délai avant l’expiration à partir duquel l’agent est prévenu (F69). */
export const SESSION_WARNING_MS = 5 * 60_000

/** Lit `exp` (secondes) dans la charge utile d’un JWT, sans le vérifier : simple information d’affichage. */
export function tokenExpiry(token: string | null): number | null {
  const payload = token?.split(".")[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as { exp?: unknown }
    return typeof json.exp === "number" ? json.exp * 1000 : null
  } catch {
    return null
  }
}

/** Minutes restantes, arrondies au supérieur (jamais négatives). */
export const minutesLeft = (expiresAt: number, now: number) => Math.max(0, Math.ceil((expiresAt - now) / 60_000))
