/**
 * Destinations autorisées après connexion (`/connexion?retour=…`).
 * Liste fermée : on ne redirige jamais vers une adresse fournie librement.
 */
export const DEFAULT_RETURN_PATH = "/espace"

const ALLOWED_RETURN_PATHS = ["/espace", "/espace/profil", "/espace/demandes", "/espace/demandes/nouvelle", "/espace/rendez-vous", "/espace/participation", "/espace/contributions", "/espace/securite", "/espace/mes-donnees", "/espace/demandes/recapitulatif", "/participer", "/participer/idees", "/espace/nouveau-code", "/bienvenue", "/espace/avis"] as const

export type ReturnPath = (typeof ALLOWED_RETURN_PATHS)[number]

export function safeReturnPath(candidate: string | null | undefined): ReturnPath {
  if (!candidate) return DEFAULT_RETURN_PATH
  // F76 : l’avis sur un service garde ses paramètres (service, demande ou rendez-vous), chemin fixe et caractères sûrs.
  if (/^\/espace\/avis\?[A-Za-z0-9=&_%.-]{1,200}$/.test(candidate)) return candidate as ReturnPath
  const normalized = candidate.length > 1 ? candidate.replace(/\/+$/, "") : candidate
  return (ALLOWED_RETURN_PATHS as readonly string[]).includes(normalized)
    ? (normalized as ReturnPath)
    : DEFAULT_RETURN_PATH
}
