/**
 * Contenus gérés par les agents : services municipaux (BC Administration),
 * publications et alertes (BC Communication). Les règles font autorité côté API.
 */
export const SERVICE_CATEGORIES = {
  demarches: "Démarches et citoyenneté",
  "cadre-de-vie": "Cadre de vie",
  "sante-solidarite": "Santé et solidarité",
  mobilite: "Mobilité",
  habitat: "Habitat",
  famille: "Famille et éducation",
  /** F74 (L26) : association partenaire (page `/partenaires` du site, carte). */
  partenaires: "Association partenaire",
} as const

export type ServiceCategory = keyof typeof SERVICE_CATEGORIES
export type ServiceStatus = "available" | "maintenance" | "incident"

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  available: "Disponible",
  maintenance: "En maintenance",
  incident: "Incident",
}

export type MunicipalService = {
  id: string
  name: string
  category: ServiceCategory
  summary: string
  description: string
  actions: string[]
  contact: ServiceContact
  featured: boolean
  keywords: string[]
  status: ServiceStatus
  statusMessage: string
  returnAt: string | null
  alternative: string
  transport: { route: string; timetable: string; information: string } | null
  updatedAt?: string
  /** F63 : désactivation d’urgence (nouvelles demandes et rendez-vous refusés), motif montré aux habitants. */
  disabled?: boolean
  disabledReason?: string
  disabledAt?: string | null
  /** F45 : adresse et coordonnées du lieu d’accueil (carte du site). */
  location?: ServiceLocation | null
  /** F46 : service d’urgence (page « Urgences » du site). */
  emergency?: EmergencyKind | null
  /** F27 : traductions du nom, du résumé et de la description (le français fait foi). */
  translations?: Partial<Record<TranslationLanguage, ServiceTranslation>> | Record<string, never>
  /** F89 : version en langage clair, relue par l’agent ; l’enregistrer vaut validation. */
  plainLanguage?: string
  /** F99 : offres d’un partenaire (disponibilité et prochaine action), catégorie `partenaires` seulement. */
  offers?: PartnerOffer[]
}

export type OfferStatus = "available" | "limited" | "full" | "paused" | "soon"
export type OfferActionKind = "call" | "visit" | "book" | "register" | "website" | "email"
export type PartnerOffer = {
  id?: string
  title: string
  description: string
  audience: string
  status: OfferStatus
  statusNote: string
  nextAvailableAt: string | null
  action: { kind: OfferActionKind; label: string; target: string }
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  available: "Disponible",
  limited: "Places limitées",
  full: "Complet",
  paused: "Suspendu",
  soon: "Bientôt disponible",
}

export const OFFER_ACTION_LABELS: Record<OfferActionKind, string> = {
  call: "Appeler",
  visit: "Se rendre sur place",
  book: "Réserver en ligne",
  register: "S’inscrire en ligne",
  website: "Consulter le site",
  email: "Écrire un e-mail",
}

export const newPartnerOffer = (): PartnerOffer => ({ title: "", description: "", audience: "", status: "available", statusNote: "", nextAvailableAt: null, action: { kind: "visit", label: "", target: "" } })

/** F63 : désactiver (motif obligatoire, 5 à 500 caractères) ou réactiver un service. */
export type ServiceAvailabilityChange = { id: string; disabled: boolean; reason: string }

export const DISABLE_REASON_MIN = 5
export const DISABLE_REASON_MAX = 500

export type ServiceLocation = { address: string; district: string | null; lat: number; lng: number }
export type EmergencyKind = "hospital" | "emergency" | "fire" | "police" | "pharmacy"
export const EMERGENCY_LABELS: Record<EmergencyKind, string> = {
  hospital: "Hôpital",
  emergency: "Urgences",
  fire: "Pompiers",
  police: "Police",
  pharmacy: "Pharmacie de garde",
}
export type TranslationLanguage = "en" | "ar"
export const TRANSLATION_LANGUAGES: Record<TranslationLanguage, { label: string; dir: "ltr" | "rtl" }> = {
  en: { label: "Anglais", dir: "ltr" },
  ar: { label: "Arabe", dir: "rtl" },
}
export type ServiceTranslation = { name: string; summary: string; description: string }

export type ContentState = "draft" | "published" | "withdrawn"

export const STATE_LABELS: Record<ContentState, string> = {
  draft: "Brouillon",
  published: "Publiée",
  withdrawn: "Retirée",
}

export type Publication = {
  id: string | null
  title: string
  category: string
  summary: string
  body: string[]
  important: boolean
  state: ContentState
  publishedAt?: string | null
  updatedAt?: string
  /** F89 : version en langage clair, relue par l’agent ; l’enregistrer vaut validation. */
  plainLanguage?: string
}

/** F89 : brouillon « En clair » proposé par l’API (modèle de langage ou repli local), jamais enregistré seul. */
export type PlainLanguageDraft = { text: string; source: "model" | "local" }
export type ServicePlainLanguageRequest = { name: string; summary: string; description: string }
export type PublicationPlainLanguageRequest = { title: string; summary: string; body: string[] }
export const PLAIN_LANGUAGE_MAX = 600

export type AlertSeverity = "info" | "warning" | "critical"
export type AlertAudience = "all" | "district" | "health"

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Information",
  warning: "Vigilance",
  critical: "Urgence",
}

export const AUDIENCE_LABELS: Record<AlertAudience, string> = {
  all: "Tous les habitants",
  district: "Un quartier",
  health: "Personnes inscrites aux alertes sanitaires",
}

export type Alert = {
  id: string | null
  title: string
  message: string
  severity: AlertSeverity
  audience: AlertAudience
  district: string | null
  /** ISO 8601. */
  startsAt: string
  endsAt: string
  /** Recommandations rédigées par l’agent, une par ligne (F31). */
  recommendations: string[]
  state: ContentState
  publishedAt?: string | null
  updatedAt?: string
  /** F73 : `official` = message officiel du Haut Conseil (tous les habitants, signé). */
  category?: AlertCategory
  signatory?: string | null
  /** F73 : confirmation explicite avant de publier un message officiel (envoyée, jamais stockée). */
  confirmOfficial?: boolean
  /** F101/F104 : nature de l’événement et zone touchée en clair. */
  kind?: AlertKind
  area?: string
}

export type AlertCategory = "standard" | "official"

export type AlertKind = "general" | "power" | "network" | "solar-storm" | "transport" | "weather" | "water" | "health"

export const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  general: "Autre / information générale",
  power: "Coupure d’électricité",
  network: "Panne des communications",
  "solar-storm": "Tempête solaire",
  transport: "Transports perturbés",
  weather: "Météo dangereuse",
  water: "Eau potable",
  health: "Santé",
}

/**
 * F101/F104 : modèles d’alerte de crise. L’agent part d’un texte clair et relu (ce qui se passe, où, que faire),
 * l’adapte puis diffuse. `startsInMinutes` : début dans N minutes (événement annoncé) ; `hours` : durée prévue.
 */
export type AlertTemplate = {
  id: string
  label: string
  startsInMinutes: number
  hours: number
  alert: Pick<Alert, "title" | "message" | "severity" | "audience" | "district" | "recommendations" | "kind" | "area">
}

export const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: "power-outage",
    label: "Coupure d’électricité d’un secteur",
    startsInMinutes: 0,
    hours: 4,
    alert: {
      title: "Coupure d’électricité dans le secteur nord",
      message: "Une panne du réseau électrique prive d’électricité le secteur nord. Les équipes techniques sont sur place ; retour du courant estimé dans 4 heures.",
      severity: "critical",
      audience: "district",
      district: "Nord",
      kind: "power",
      area: "Secteur nord",
      recommendations: [
        "Débranchez les appareils sensibles pour éviter une surtension au retour du courant.",
        "Utilisez une lampe torche plutôt que des bougies.",
        "Gardez le réfrigérateur fermé : il conserve le froid environ 4 heures.",
        "Personne dépendante d’un appareil médical électrique : rendez-vous à la maison de quartier équipée d’un groupe électrogène ou appelez le 15.",
      ],
    },
  },
  {
    id: "solar-storm",
    label: "Tempête solaire annoncée",
    startsInMinutes: 30,
    hours: 4,
    alert: {
      title: "Tempête solaire : communications perturbées",
      message: "Une tempête solaire atteindra Nova Terra dans une trentaine de minutes. Les réseaux mobiles, Internet et la navigation pourront être coupés pendant plusieurs heures.",
      severity: "critical",
      audience: "all",
      district: null,
      kind: "solar-storm",
      area: "Toute la ville",
      recommendations: [
        "Notez dès maintenant les numéros utiles : secours 112, médecin 15, pompiers 18.",
        "Restez à l’intérieur des dômes et reportez les sorties en surface.",
        "Chargez vos téléphones et lampes ; gardez une radio à piles allumée sur 98.4 FM.",
        "Si les communications sont coupées, rendez-vous au poste de secours le plus proche en cas d’urgence.",
      ],
    },
  },
  {
    id: "network-outage",
    label: "Panne des réseaux de communication",
    startsInMinutes: 0,
    hours: 3,
    alert: {
      title: "Panne des réseaux de communication",
      message: "Une panne touche le réseau Internet et les téléphones mobiles. Les appels d’urgence restent acheminés en priorité.",
      severity: "warning",
      audience: "all",
      district: null,
      kind: "network",
      area: "Toute la ville",
      recommendations: [
        "Les numéros d’urgence 112, 15, 17 et 18 restent joignables.",
        "Le site garde les consignes et les pages déjà ouvertes sur votre appareil.",
        "Écoutez la radio de la ville (98.4 FM) pour les informations officielles.",
      ],
    },
  },
  {
    id: "transport-disruption",
    label: "Lignes de transport interrompues",
    startsInMinutes: 0,
    hours: 6,
    alert: {
      title: "Lignes de transport interrompues",
      message: "Plusieurs lignes de transport sont interrompues. Des solutions de remplacement sont proposées sur la page Transports du site.",
      severity: "warning",
      audience: "all",
      district: null,
      kind: "transport",
      area: "",
      recommendations: [
        "Consultez la page Transports : chaque ligne interrompue indique sa solution de remplacement.",
        "Prévoyez plus de temps pour vos trajets.",
        "Personne à mobilité réduite : demandez le transport à la demande au service Mobilité.",
      ],
    },
  },
]

/** Nouvelle alerte à partir d’un modèle : dates calculées depuis maintenant. */
export const alertFromTemplate = (template: AlertTemplate, now = new Date()): Alert => {
  const start = new Date(now.getTime() + template.startsInMinutes * 60_000)
  return {
    ...newAlert(now),
    ...template.alert,
    recommendations: [...template.alert.recommendations],
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + template.hours * 3_600_000).toISOString(),
  }
}

/** Texte multiligne ↔ liste de paragraphes (lignes vides ignorées). */
export const toLines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean)
export const fromLines = (lines: string[]) => lines.join("\n")

/** `datetime-local` (heure locale) ↔ ISO 8601. */
export const toLocalInput = (iso: string) => {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
export const fromLocalInput = (value: string) => new Date(value).toISOString()

export const newPublication = (): Publication => ({
  id: null, title: "", category: "Vie municipale", summary: "", body: [], important: false, state: "draft",
})

export const newAlert = (now = new Date()): Alert => ({
  id: null,
  title: "",
  message: "",
  severity: "warning",
  audience: "all",
  district: null,
  startsAt: now.toISOString(),
  endsAt: new Date(now.getTime() + 24 * 3_600_000).toISOString(),
  recommendations: [],
  state: "draft",
  kind: "general",
  area: "",
})

/** F73 : message officiel du Haut Conseil, adressé à tous, en tête de toutes les pages du site. */
export const newOfficialMessage = (now = new Date()): Alert => ({
  ...newAlert(now),
  severity: "info",
  audience: "all",
  endsAt: new Date(now.getTime() + 7 * 24 * 3_600_000).toISOString(),
  category: "official",
  signatory: "Le Haut Conseil de Nova Terra",
})

export const newService = (): MunicipalService => ({
  id: "",
  name: "",
  category: "demarches",
  summary: "",
  description: "",
  actions: [],
  contact: { place: "", hours: "", phone: null },
  featured: false,
  keywords: [],
  status: "available",
  statusMessage: "",
  returnAt: null,
  alternative: "",
  transport: null,
})

export const isAlertActive = (alert: Alert, now = Date.now()) =>
  alert.state === "published" && Date.parse(alert.startsAt) <= now && now < Date.parse(alert.endsAt)

/** F74 : horaires structurés (jour 1 = lundi … 7 = dimanche) et contact d’une association partenaire. */
export type OpeningSlot = { day: number; opens: string; closes: string }
export type ServiceContact = {
  place: string
  hours: string
  phone: string | null
  person?: string
  email?: string
  website?: string
  openingHours?: OpeningSlot[]
}

export const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const

/** « 09:00-12:00, 14:00-18:00 » ↔ plages du jour. */
export const formatDaySlots = (slots: OpeningSlot[] | undefined, day: number) =>
  (slots ?? []).filter((slot) => slot.day === day).map((slot) => `${slot.opens}-${slot.closes}`).join(", ")

export function parseDaySlots(text: string, day: number): OpeningSlot[] | null {
  const ranges = text.split(",").map((part) => part.trim()).filter(Boolean)
  const slots: OpeningSlot[] = []
  for (const range of ranges) {
    const match = /^(\d{1,2})[:h](\d{2})\s*-\s*(\d{1,2})[:h](\d{2})$/.exec(range)
    if (!match) return null
    const [, openHour = "", openMinute = "", closeHour = "", closeMinute = ""] = match
    const opens = `${openHour.padStart(2, "0")}:${openMinute}`
    const closes = `${closeHour.padStart(2, "0")}:${closeMinute}`
    if (closes <= opens) return null
    slots.push({ day, opens, closes })
  }
  return slots
}

/**
 * F97 : ligne de transport municipal (Administration), son état et ses solutions de remplacement.
 * Une ligne interrompue doit proposer au moins une solution ; le site les affiche sur `/transports`.
 */
export type LineStatus = "normal" | "disrupted" | "interrupted"
export type TransportMode = "shuttle" | "tram" | "bus" | "cable" | "rover"
export type ReplacementKind = "substitute-shuttle" | "other-line" | "on-demand" | "walk" | "bike"
export type LineReplacement = { kind: ReplacementKind; label: string; details: string; lineId: string | null }

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
  replacements: LineReplacement[]
  updatedAt?: string
}

export const LINE_STATUS_LABELS: Record<LineStatus, string> = { normal: "Circule normalement", disrupted: "Perturbée", interrupted: "Interrompue" }
export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = { shuttle: "Navette", tram: "Tram", bus: "Bus", cable: "Téléphérique", rover: "Rover" }
export const REPLACEMENT_KIND_LABELS: Record<ReplacementKind, string> = {
  "substitute-shuttle": "Navette de substitution",
  "other-line": "Autre ligne",
  "on-demand": "Transport à la demande",
  walk: "À pied",
  bike: "À vélo",
}

export const newTransportLine = (): TransportLine => ({
  id: "", code: "", name: "", mode: "bus", stops: [], districts: [], frequency: "", status: "normal", statusMessage: "", disruptedSince: null, returnAt: null, replacements: [],
})
