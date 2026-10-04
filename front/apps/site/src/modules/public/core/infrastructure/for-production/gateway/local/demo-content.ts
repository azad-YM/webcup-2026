/**
 * CONTENU DE DÉMONSTRATION — n’est plus branché sur le site.
 *
 * Le site lit le catalogue des services (Administration) et les publications
 * (Communication) par HTTP ; ce contenu a servi de jeu initial à la migration
 * `Version20261003003000`. Il ne reste ici que pour les tests de la vitrine.
 */
import type { MunicipalService } from "../../../../domain/municipal-service"
import type { Publication } from "../../../../domain/publication"

export const DEMO_SERVICES: MunicipalService[] = [
  {
    id: "etat-civil",
    name: "État civil et citoyenneté",
    category: "demarches",
    summary: "Actes de naissance, de mariage et de décès, recensement des nouveaux arrivants, listes électorales.",
    description: "Le service de l’état civil enregistre les grands moments de la vie des habitants de Nova Terra et délivre les justificatifs officiels. Toute personne arrivée par un convoi doit se faire recenser dans le mois qui suit son arrivée.",
    actions: [
      "Demander un acte de naissance, de mariage ou de décès",
      "Se faire recenser à l’arrivée sur Nova Terra",
      "S’inscrire sur les listes électorales",
      "Préparer un mariage ou un pacte civil"
    ],
    contact: { place: "Hôtel de ville, dôme central — guichet 1", hours: "Du lundi au vendredi, 8 h 30 – 17 h", phone: "01 00 00 10 10" },
    featured: true,
    keywords: ["acte", "naissance", "mariage", "décès", "recensement", "arrivée", "élections", "papiers", "identité"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  },
  {
    id: "sante",
    name: "Santé",
    category: "sante-solidarite",
    summary: "Centre médical, téléconsultation, vaccinations et prévention face aux rayonnements.",
    description: "Le centre médical municipal assure les soins courants et les urgences. Une téléconsultation est disponible jour et nuit, et des bilans de prévention liés aux rayonnements et à la faible gravité sont proposés à tous les habitants.",
    actions: [
      "Prendre rendez-vous au centre médical",
      "Lancer une téléconsultation",
      "Consulter le calendrier des vaccinations",
      "Faire un bilan de prévention rayonnements"
    ],
    contact: { place: "Centre médical, quartier Aurore", hours: "Tous les jours, 7 h – 21 h ; urgences 24 h / 24", phone: "15" },
    featured: true,
    keywords: ["médecin", "soins", "urgence", "vaccin", "téléconsultation", "radiation", "rayonnement", "hôpital"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  },
  {
    id: "voirie-eclairage",
    name: "Voirie et éclairage",
    category: "cadre-de-vie",
    summary: "Entretien des voies et des passerelles entre les dômes, éclairage public, signalisation.",
    description: "Les équipes de voirie entretiennent les voies de circulation, les passerelles pressurisées qui relient les dômes et l’éclairage public, essentiel pendant les longues nuits de la planète.",
    actions: [
      "Signaler un problème sur la voie publique (bientôt en ligne)",
      "Consulter les travaux en cours",
      "Demander une autorisation d’occupation de la voie"
    ],
    contact: { place: "Centre technique municipal, zone nord", hours: "Du lundi au samedi, 7 h – 18 h", phone: "01 00 00 20 20" },
    featured: true,
    keywords: ["route", "rue", "trottoir", "passerelle", "lampadaire", "lumière", "travaux", "signalement", "panne"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  },
  {
    id: "transports",
    name: "Transports",
    category: "mobilite",
    summary: "Navettes entre les quartiers, rovers en libre-service, horaires et abonnements.",
    description: "Le réseau de navettes relie les quartiers de Nova Terra toutes les dix minutes en journée. Des rovers électriques en libre-service permettent de rejoindre les serres et les zones d’exploitation.",
    actions: [
      "Consulter les horaires des navettes",
      "Souscrire un abonnement mensuel",
      "Réserver un rover en libre-service"
    ],
    contact: { place: "Gare centrale des navettes", hours: "Tous les jours, 6 h – 23 h", phone: "01 00 00 30 30" },
    featured: true,
    keywords: ["navette", "bus", "rover", "horaire", "abonnement", "déplacement", "mobilité"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  },
  {
    id: "eau-energie",
    name: "Eau et énergie",
    category: "cadre-de-vie",
    summary: "Distribution et recyclage de l’eau, réseau solaire, raccordements et abonnements.",
    description: "La régie municipale produit l’eau potable par recyclage et extraction, et distribue l’électricité du réseau solaire. Elle gère les raccordements des logements et les abonnements.",
    actions: [
      "Ouvrir ou transférer un abonnement",
      "Déclarer une fuite ou une coupure",
      "Suivre sa consommation"
    ],
    contact: { place: "Régie de l’eau et de l’énergie, dôme est", hours: "Du lundi au vendredi, 8 h – 17 h ; astreinte 24 h / 24", phone: "01 00 00 40 40" },
    featured: false,
    keywords: ["eau", "électricité", "énergie", "solaire", "fuite", "coupure", "facture", "abonnement"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  },
  {
    id: "logement",
    name: "Logement",
    category: "habitat",
    summary: "Demande de logement en module habitable, aides au logement, attribution aux nouveaux arrivants.",
    description: "Le service du logement attribue les modules habitables aux foyers, en priorité aux nouveaux arrivants et aux familles. Il accompagne aussi les demandes d’aide et de changement de logement.",
    actions: [
      "Déposer une demande de logement",
      "Demander un changement de module",
      "Se renseigner sur les aides au logement"
    ],
    contact: { place: "Hôtel de ville, dôme central — guichet 4", hours: "Du lundi au vendredi, 9 h – 16 h", phone: "01 00 00 50 50" },
    featured: false,
    keywords: ["logement", "module", "habitat", "appartement", "aide", "loyer", "attribution"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  },
  {
    id: "education",
    name: "Éducation et petite enfance",
    category: "famille",
    summary: "Crèches, écoles, restauration scolaire et activités périscolaires.",
    description: "Nova Terra accueille les enfants de 3 mois à 16 ans dans ses crèches et ses écoles. Les inscriptions et la restauration scolaire, issue des serres de la ville, sont gérées par la mairie.",
    actions: [
      "Inscrire un enfant à la crèche ou à l’école",
      "Réserver la restauration scolaire",
      "Découvrir les activités périscolaires"
    ],
    contact: { place: "Maison de l’enfance, quartier des Pionniers", hours: "Du lundi au vendredi, 8 h – 18 h", phone: "01 00 00 60 60" },
    featured: false,
    keywords: ["école", "crèche", "enfant", "cantine", "inscription", "périscolaire", "famille"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  },
  {
    id: "proprete-recyclage",
    name: "Propreté et recyclage",
    category: "cadre-de-vie",
    summary: "Collecte et tri des déchets, compostage pour les serres, encombrants.",
    description: "Sur Nova Terra, presque tout se recycle : les déchets organiques nourrissent les serres et les matériaux sont réemployés. Le service organise la collecte, le tri et l’enlèvement des encombrants.",
    actions: [
      "Consulter les jours de collecte de son quartier",
      "Demander l’enlèvement d’un encombrant",
      "Obtenir un composteur"
    ],
    contact: { place: "Centre de recyclage, zone sud", hours: "Du mardi au samedi, 8 h – 17 h", phone: "01 00 00 70 70" },
    featured: false,
    keywords: ["déchets", "poubelle", "tri", "recyclage", "compost", "encombrant", "collecte", "propreté"],
    status: "available",
    statusMessage: "",
    returnAt: null,
    alternative: "",
    transport: null
  }
]

export const DEMO_PUBLICATIONS: Publication[] = [
  {
    id: "centre-sante-aurore",
    title: "Le centre médical du quartier Aurore étend ses horaires",
    category: "Santé",
    summary: "À partir du 6 octobre, le centre médical accueille les habitants tous les jours de 7 h à 21 h, sans rendez-vous le matin.",
    body: [
      "Pour répondre à l’arrivée des nouveaux habitants, le centre médical du quartier Aurore étend ses horaires d’ouverture à partir du lundi 6 octobre : il sera ouvert tous les jours, de 7 h à 21 h.",
      "Les consultations sont sans rendez-vous le matin. L’après-midi est réservé aux rendez-vous et aux bilans de prévention liés aux rayonnements. Les urgences restent assurées 24 h / 24.",
      "La téléconsultation reste disponible jour et nuit depuis la page du service Santé."
    ],
    publishedAt: "2026-10-02T09:00:00+00:00",
    important: false
  },
  {
    id: "travaux-avenue-pionniers",
    title: "Travaux d’éclairage sur l’avenue des Pionniers",
    category: "Travaux",
    summary: "Le remplacement des lampadaires de l’avenue des Pionniers aura lieu du 7 au 11 octobre. La circulation des navettes est maintenue.",
    body: [
      "Les équipes de la voirie remplacent les lampadaires de l’avenue des Pionniers par un éclairage plus économe, adapté aux longues nuits de la planète.",
      "Les travaux se dérouleront du 7 au 11 octobre, de 8 h à 17 h. La circulation des navettes est maintenue ; les piétons sont invités à emprunter la passerelle couverte côté serres.",
      "Pour toute question, contactez le centre technique municipal."
    ],
    publishedAt: "2026-09-29T14:00:00+00:00",
    important: false
  },
  {
    id: "accueil-nouveaux-arrivants",
    title: "Bienvenue aux passagers du troisième convoi",
    category: "Vie municipale",
    summary: "Les nouveaux habitants arrivés par le troisième convoi sont attendus à l’hôtel de ville pour leur recensement et la remise de leur kit d’accueil.",
    body: [
      "La ville de Nova Terra souhaite la bienvenue aux habitants arrivés par le troisième convoi. Un accueil spécial est organisé à l’hôtel de ville, dans le dôme central, jusqu’à la fin du mois.",
      "Sur place, le service de l’état civil procède au recensement et remet à chaque foyer son kit d’accueil : plan de la ville, horaires des navettes et informations de santé.",
      "Vous pouvez aussi créer dès maintenant votre compte citoyen sur ce site pour retrouver vos démarches dans votre espace personnel."
    ],
    publishedAt: "2026-09-25T10:00:00+00:00",
    important: false
  }
]
