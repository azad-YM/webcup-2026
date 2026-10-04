import type { AlertKind } from "./alert"

/**
 * Consignes générales par situation (F93, F94, F101, F104). Contenu statique, intégré au code du site :
 * il reste lisible sans réseau, sans API et sans données enregistrées. Les consignes précises d’un événement
 * viennent des alertes rédigées par les agents (Communication) ; celles-ci servent de base commune.
 */
export type CrisisGuide = {
  id: "network" | "power" | "solar-storm" | "transport" | "platform"
  title: string
  /** Une phrase : à quoi s’attendre. */
  summary: string
  steps: string[]
}

export const CRISIS_GUIDES: CrisisGuide[] = [
  {
    id: "network",
    title: "Panne de réseau ou d’Internet",
    summary: "Le site et les applications peuvent devenir inaccessibles. Les appels d’urgence restent prioritaires.",
    steps: [
      "Les numéros d’urgence (112, 15, 17, 18) fonctionnent même sans forfait ni Internet.",
      "Cette page et les pages déjà ouvertes restent lisibles sur votre appareil.",
      "Une demande en cours de saisie est gardée en brouillon : envoyez-la au retour du réseau.",
      "Écoutez la radio de la ville (98.4 FM) pour les informations officielles.",
      "En cas d’urgence sans réseau, rendez-vous au poste de secours ou à la maison de quartier la plus proche."
    ]
  },
  {
    id: "power",
    title: "Coupure d’électricité",
    summary: "Éclairage, chauffage, ascenseurs et recharge des appareils peuvent être interrompus.",
    steps: [
      "Débranchez les appareils sensibles pour éviter une surtension au retour du courant.",
      "Utilisez une lampe torche plutôt que des bougies.",
      "Gardez le réfrigérateur et le congélateur fermés.",
      "N’utilisez pas les ascenseurs ; aidez les voisins âgés ou isolés.",
      "Appareil médical électrique : rejoignez une maison de quartier équipée d’un groupe électrogène ou appelez le 15."
    ]
  },
  {
    id: "solar-storm",
    title: "Tempête solaire",
    summary: "Téléphones, Internet et navigation peuvent être coupés pendant plusieurs heures.",
    steps: [
      "Notez maintenant les numéros utiles et l’adresse du poste de secours le plus proche.",
      "Restez à l’intérieur des dômes et reportez les sorties en surface.",
      "Chargez téléphones, lampes et batteries tant que c’est possible.",
      "Gardez une radio à piles allumée sur 98.4 FM.",
      "Ne vous fiez pas au GPS : suivez la signalisation et les agents de la ville."
    ]
  },
  {
    id: "transport",
    title: "Transports interrompus",
    summary: "Une ligne peut être coupée : une solution de remplacement est proposée par la ville.",
    steps: [
      "Consultez la page « Transports » : chaque ligne interrompue indique sa solution de remplacement.",
      "Prévoyez plus de temps et privilégiez les navettes de substitution signalées aux arrêts.",
      "Personne à mobilité réduite : demandez le transport à la demande auprès du service Mobilité."
    ]
  },
  {
    id: "platform",
    title: "Site de la ville en difficulté",
    summary: "Certaines démarches peuvent être momentanément indisponibles ; l’essentiel reste consultable.",
    steps: [
      "Les alertes, les consignes, les numéros d’urgence et les coordonnées des services restent affichés.",
      "Les démarches non urgentes peuvent attendre : votre brouillon est conservé sur cet appareil.",
      "Pour une démarche urgente, appelez ou rendez-vous directement au service concerné."
    ]
  }
]

/** Consignes générales correspondant à la nature d’une alerte, si elles existent. */
export function guideForKind(kind: AlertKind | undefined): CrisisGuide | null {
  if (kind === "power" || kind === "solar-storm" || kind === "transport") return CRISIS_GUIDES.find((guide) => guide.id === kind) ?? null
  if (kind === "network") return CRISIS_GUIDES.find((guide) => guide.id === "network") ?? null
  return null
}

/** Numéros d’urgence, statiques : affichés même sans réseau ni API (mêmes numéros que la page Urgences). */
export const EMERGENCY_NUMBERS = [
  { number: "112", label: "Numéro d’urgence européen" },
  { number: "15", label: "SAMU — urgence médicale" },
  { number: "17", label: "Police" },
  { number: "18", label: "Pompiers" },
  { number: "114", label: "Urgences par SMS (sourds et malentendants)", sms: true }
] as const
