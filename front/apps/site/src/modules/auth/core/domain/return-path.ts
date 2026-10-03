/**
 * Destinations autorisées après connexion (`/connexion?retour=…`).
 * Liste fermée : on ne redirige jamais vers une adresse fournie librement.
 */
export const DEFAULT_RETURN_PATH = "/espace"

const ALLOWED_RETURN_PATHS = ["/espace", "/espace/profil", "/espace/demandes", "/espace/demandes/nouvelle", "/espace/rendez-vous", "/espace/participation"] as const

export type ReturnPath = (typeof ALLOWED_RETURN_PATHS)[number]

export function safeReturnPath(candidate: string | null | undefined): ReturnPath {
  if (!candidate) return DEFAULT_RETURN_PATH
  const normalized = candidate.length > 1 ? candidate.replace(/\/+$/, "") : candidate
  return (ALLOWED_RETURN_PATHS as readonly string[]).includes(normalized)
    ? (normalized as ReturnPath)
    : DEFAULT_RETURN_PATH
}
