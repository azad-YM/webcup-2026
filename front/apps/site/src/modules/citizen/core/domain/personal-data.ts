/**
 * F55 — « Mes données » : contrat de `POST /api/citizen/me/personal-data`
 * (format `nova-terra.donnees-personnelles`, version 1, voir `api/src/Citizen/doc/mes-donnees.md`).
 */
export type PersonalDataSectionKey =
  | "compte"
  | "profil"
  | "preferences"
  | "demandes"
  | "rendez-vous"
  | "notifications"
  | "participation"
  | "appareils"
  | "connexions"

export type PersonalDataSection = {
  key: PersonalDataSectionKey
  title: string
  explanation: string
  data: unknown
}

export type PersonalDataExport = {
  format: "nova-terra.donnees-personnelles"
  version: 1
  generatedAt: string
  controller: string
  sections: PersonalDataSection[]
}

/** Confirmation d'identité : mot de passe, ou code reçu par e-mail. */
export type IdentityProof = { password: string } | { challengeId: string; code: string }

/** Libellés français des champs techniques, pour l'affichage lisible (le JSON garde les noms d'origine). */
export const FIELD_LABELS: Record<string, string> = {
  email: "Adresse e-mail",
  name: "Nom du compte",
  status: "État",
  emailVerificationEnabled: "Vérification par code e-mail",
  firstName: "Prénom",
  lastName: "Nom",
  phone: "Téléphone",
  address: "Adresse",
  district: "Quartier",
  preferredLanguage: "Langue préférée",
  registeredAt: "Inscription le",
  profileCompleted: "Profil complété",
  healthConsent: "Accord pour les alertes sanitaires",
  reference: "Numéro de suivi",
  type: "Type",
  subject: "Objet",
  description: "Description",
  message: "Message",
  location: "Lieu",
  createdAt: "Créé le",
  updatedAt: "Mis à jour le",
  steps: "Étapes",
  trail: "Étapes",
  isPublic: "Visible des autres habitants",
  supportCount: "Soutiens reçus",
  serviceName: "Service",
  when: "Date",
  title: "Titre",
  readAt: "Lu le",
  link: "Lien",
  kind: "Catégorie",
  topic: "Thème",
  response: "Réponse de la mairie",
  concerns: "Inquiétudes",
  supports: "Signalements soutenus",
  supportedAt: "Soutenu le",
  label: "Appareil",
  firstSeenAt: "Première connexion",
  lastUsedAt: "Dernière utilisation",
  trustedUntil: "Appareil de confiance jusqu’au",
  at: "Date",
  method: "Méthode",
  deviceLabel: "Appareil",
  secondFactor: "Code e-mail demandé",
  ip: "Adresse IP",
  comment: "Commentaire",
  durationMinutes: "Durée (minutes)",
  instructions: "Consignes"
}

/** Champs techniques sans intérêt pour le citoyen dans la vue lisible (présents dans le JSON). */
export const HIDDEN_FIELDS = new Set(["id", "serviceId", "allowedTransitions", "canChange", "timezone", "timezoneLabel", "startsAt", "endsAt"])
