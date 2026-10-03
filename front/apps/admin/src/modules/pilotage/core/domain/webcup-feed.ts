/** Normalized contest feed served by `GET /api/pilotage/webcup-feed` (BC Pilotage). */
export type WebcupSession = {
  status: string | null
  isRunning: boolean
  currentWave: number | null
  elapsedMinutes: number | null
  visibleRequestsCount: number | null
  nextWaveNumber: number | null
  minutesUntilNextWave: number | null
  hasNextWave: boolean
  requestsCount: number
  totalXpAvailable: number
}

export type WebcupRequest = {
  requestCode: string
  requesterName: string | null
  requesterType: string | null
  messagePublic: string | null
  difficulty: string | null
  difficultyLevel: number | null
  xpBase: number
  xpTimeBonus: number
  xpTotal: number
  xpAvailable: number | null
  isInitial: boolean
  waveNumber: number | null
  arrivalTime: string | null
  groupName: string | null
  isAiRequest: boolean
  sortOrder: number | null
}

export type WebcupFeed = {
  session: WebcupSession
  requests: WebcupRequest[]
  fetchedAt: string
}

export type RequestFilters = {
  wave: string
  difficulty: string
}

const DIFFICULTY_LABELS: Record<number, string> = { 1: "Facile", 2: "Moyenne", 3: "Difficile", 4: "Expert" }

export const difficultyLabel = (request: Pick<WebcupRequest, "difficulty" | "difficultyLevel">): string =>
  (request.difficultyLevel !== null ? DIFFICULTY_LABELS[request.difficultyLevel] : undefined) ?? request.difficulty ?? "—"

export const waveKey = (request: Pick<WebcupRequest, "waveNumber">): string =>
  request.waveNumber === null ? "" : String(request.waveNumber)

export const waveLabel = (key: string): string =>
  key === "" ? "Sans vague" : key === "0" ? "Demandes initiales" : `Vague ${key}`

export const waveOptions = (requests: WebcupRequest[]): string[] =>
  [...new Set(requests.map(waveKey))].sort((a, b) => (a === "" ? -1 : Number(a)) - (b === "" ? -1 : Number(b)))

export const difficultyOptions = (requests: WebcupRequest[]): { value: string; label: string }[] => {
  const options = new Map<string, string>()
  requests.forEach(request => options.set(difficultyKey(request), difficultyLabel(request)))
  return [...options.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([value, label]) => ({ value, label }))
}

export const difficultyKey = (request: Pick<WebcupRequest, "difficulty" | "difficultyLevel">): string =>
  request.difficultyLevel !== null ? String(request.difficultyLevel) : request.difficulty ?? ""

export const filterRequests = (requests: WebcupRequest[], filters: RequestFilters): WebcupRequest[] =>
  requests.filter(request =>
    (filters.wave === "all" || waveKey(request) === filters.wave) &&
    (filters.difficulty === "all" || difficultyKey(request) === filters.difficulty))

/** Codes not present in the baseline of the previous visit. A first visit (no baseline) highlights nothing. */
export const newRequestCodes = (requests: WebcupRequest[], baseline: readonly string[] | null): Set<string> =>
  baseline === null ? new Set() : new Set(requests.map(request => request.requestCode).filter(code => !baseline.includes(code)))

/** Indicative seconds before the next wave, counted from the moment the server read the API. */
export const secondsUntilNextWave = (feed: Pick<WebcupFeed, "session" | "fetchedAt">, now: Date): number | null => {
  const { session } = feed
  if (!session.hasNextWave || session.minutesUntilNextWave === null) return null
  const fetchedAt = Date.parse(feed.fetchedAt)
  if (Number.isNaN(fetchedAt)) return null
  return Math.max(0, Math.round((fetchedAt + session.minutesUntilNextWave * 60_000 - now.getTime()) / 1000))
}

export const formatCountdown = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const pad = (value: number) => String(value).padStart(2, "0")
  return hours > 0 ? `${hours} h ${pad(minutes)} min` : `${pad(minutes)}:${pad(rest)}`
}

export const formatElapsed = (minutes: number | null): string => {
  if (minutes === null) return "—"
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `H+${hours} h ${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`
}
