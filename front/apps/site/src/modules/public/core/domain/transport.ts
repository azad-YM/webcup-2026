/**
 * F97 : lignes de transport municipal (propriétaire : Administration) et aide au trajet (Assistance).
 * Une ligne interrompue propose ses solutions de remplacement ; l’aide au trajet calcule les options à partir
 * de l’état réel des lignes (règles), le modèle de langage ne fait que rédiger la réponse.
 */
export type LineStatus = "normal" | "disrupted" | "interrupted"
export type TransportMode = "shuttle" | "tram" | "bus" | "cable" | "rover"
export type ReplacementKind = "substitute-shuttle" | "other-line" | "on-demand" | "walk" | "bike"

export type Replacement = { kind: ReplacementKind; label: string; details: string; lineId: string | null; lineStatus?: LineStatus | null; lineCode?: string | null }

export type TransportLine = {
  id: string
  code: string
  name: string
  mode: TransportMode
  stops: string[]
  districts: string[]
  frequency: string
  status: LineStatus
  statusMessage: string
  disruptedSince: string | null
  returnAt: string | null
  replacements: Replacement[]
  updatedAt: string
}

export type TripOption = {
  lineId: string
  code: string
  name: string
  status: LineStatus
  statusMessage: string
  returnAt: string | null
  /** `ok` : elle circule ; `delayed` : perturbée ; `replaced` : interrompue, voir les solutions de remplacement. */
  verdict: "ok" | "delayed" | "replaced"
  replacements: Replacement[]
  transfer: { stop: string; lineId: string; code: string; name: string; status: LineStatus } | null
}

export type TripHelp = {
  answer: string
  from: string | null
  to: string | null
  options: TripOption[]
  source: "model" | "local"
  emergency: { kind: string; numbers: string[] } | null
}

export type TripRequest = { question: string; from: string | null; to: string | null; language: string }

export const LINE_STATUS_LABELS: Record<LineStatus, string> = {
  normal: "Circule normalement",
  disrupted: "Perturbée",
  interrupted: "Interrompue"
}

export const MODE_LABELS: Record<TransportMode, string> = {
  shuttle: "Navette",
  tram: "Tram",
  bus: "Bus",
  cable: "Téléphérique",
  rover: "Rover"
}

export const REPLACEMENT_LABELS: Record<ReplacementKind, string> = {
  "substitute-shuttle": "Navette de substitution",
  "other-line": "Autre ligne",
  "on-demand": "Transport à la demande",
  walk: "À pied",
  bike: "À vélo"
}

/** Tous les lieux du réseau (arrêts puis quartiers), triés, pour les listes « Départ » et « Destination ». */
export function networkPlaces(lines: TransportLine[]): { stops: string[]; districts: string[] } {
  const stops = new Set<string>()
  const districts = new Set<string>()
  for (const line of lines) {
    line.stops.forEach((stop) => stops.add(stop))
    line.districts.forEach((district) => districts.add(district))
  }
  const sort = (values: Set<string>) => [...values].sort((a, b) => a.localeCompare(b, "fr"))
  return { stops: sort(stops), districts: sort(districts) }
}

/** Lignes qui desservent un quartier d’abord (quartier choisi sur l’appareil), l’ordre de l’API ensuite. */
export function linesForDistrict(lines: TransportLine[], district: string | null): TransportLine[] {
  if (!district) return lines
  return [...lines].sort((a, b) => Number(b.districts.includes(district)) - Number(a.districts.includes(district)))
}
