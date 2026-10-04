import { siteEnv } from "./env"

/**
 * F69 (ADR 007) : politique de sécurité du contenu du site exporté en statique (balise `<meta>`, pas d’en-tête
 * possible sans serveur). Scripts et styles du site seulement (`unsafe-inline` : l’export Next et le script
 * d’affichage sans flash sont en ligne), appels et flux temps réel (SSE) vers l’API seulement, aucun objet ni
 * formulaire vers un autre site. `frame-ancestors` n’est pas pris en compte en `<meta>` : il est posé par l’API
 * et, en production, par l’hébergeur. Désactivée en développement (le serveur de dev utilise `eval`).
 */
export function contentSecurityPolicy(): string | null {
  if (process.env.NODE_ENV !== "production") return null
  const api = new URL(siteEnv.apiBaseUrl).origin
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${api}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].filter((directive) => !(directive === "upgrade-insecure-requests" && api.startsWith("http:"))).join("; ")
}
