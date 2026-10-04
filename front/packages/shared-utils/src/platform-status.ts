/**
 * État de la plateforme (F77, ADR 012) : `GET /api/platform/status` annonce le mode allégé (surcharge).
 *
 * `ApiClient` signale aussi l’en-tête `X-Platform-Mode: degraded` de n’importe quelle réponse : les deux sources
 * émettent l’événement navigateur `nova-terra:mode-degrade`, auquel le site raccorde son mode léger (L17).
 */
export const DEGRADED_MODE_EVENT = "nova-terra:mode-degrade"

export type PlatformStatus = {
  mode: "normal" | "degraded"
  source: "env" | "manual" | "auto" | null
  since: string | null
  until: string | null
  reason: string
  message: string
  essential: string[]
  suspended: string[]
  retryAfter: number | null
}

let announced = false

/** Émet une seule fois par page l’événement du mode allégé. */
export function announceDegradedMode(): void {
  if (announced || typeof window === "undefined") return
  announced = true
  window.dispatchEvent(new CustomEvent(DEGRADED_MODE_EVENT))
}

export async function fetchPlatformStatus(apiBaseUrl: string): Promise<PlatformStatus | null> {
  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/platform/status`, { headers: { Accept: "application/json" } })
    if (!response.ok) return null
    return (await response.json()) as PlatformStatus
  } catch {
    return null
  }
}

/**
 * Surveille l’état de la plateforme : premier appel immédiat, puis à intervalle (espacé de moitié en plus à chaque
 * échec, jusqu’à 10 minutes). Renvoie la fonction d’arrêt.
 */
export function watchPlatformStatus(apiBaseUrl: string, onStatus: (status: PlatformStatus) => void, intervalMs = 120_000): () => void {
  let stopped = false
  let delay = intervalMs
  let timer: ReturnType<typeof setTimeout> | null = null
  const tick = async () => {
    const status = await fetchPlatformStatus(apiBaseUrl)
    if (stopped) return
    if (status) {
      delay = intervalMs
      if (status.mode === "degraded") announceDegradedMode()
      onStatus(status)
    } else {
      delay = Math.min(600_000, Math.round(delay * 1.5))
    }
    timer = setTimeout(() => void tick(), delay)
  }
  void tick()
  return () => {
    stopped = true
    if (timer) clearTimeout(timer)
  }
}
