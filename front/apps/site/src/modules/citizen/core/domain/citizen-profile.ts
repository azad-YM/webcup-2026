/**
 * Profil citoyen tel que l’expose Citizen (vue `CitizenProfile`, lot L1).
 * Les règles font autorité côté API : celles-ci ne servent qu’à guider la saisie.
 * Source : api/src/Citizen/doc/README.md#contrat-http--inscription-et-profil-lot-l1
 */
export type CitizenProfile = {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  district: string | null
  preferredLanguage: string | null
  registeredAt: string
  profileCompleted: boolean
}

export const PROFILE_FIELDS = ["firstName", "lastName", "phone", "address", "district", "preferredLanguage"] as const
export type ProfileField = (typeof PROFILE_FIELDS)[number]

/** Corps de `PUT /api/citizen/me` : chaque champ est `string | null`. */
export type CitizenProfileUpdate = Record<ProfileField, string | null>
/** Saisie brute du formulaire. */
export type CitizenProfileDraft = Record<ProfileField, string>
export type ProfileErrors = Partial<Record<ProfileField, string>>

export const PROFILE_MAX_LENGTHS: Record<ProfileField, number> = {
  firstName: 100,
  lastName: 100,
  phone: 30,
  address: 255,
  district: 100,
  preferredLanguage: 5
}

export const PROFILE_LABELS: Record<ProfileField, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  phone: "Téléphone",
  address: "Adresse",
  district: "Quartier",
  preferredLanguage: "Langue préférée"
}

/** Langues proposées dans l’interface ; la liste définitive relève de D14 (lot L5). */
export const PREFERRED_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" }
] as const

const PHONE_PATTERN = /^[+\d][\d\s.\-()]*$/

export function toDraft(profile: CitizenProfile | null): CitizenProfileDraft {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, profile?.[field] ?? ""])) as CitizenProfileDraft
}

/** Nettoie la saisie : espaces superflus retirés, champ vide → `null`. */
export function normalizeDraft(draft: CitizenProfileDraft): CitizenProfileUpdate {
  return Object.fromEntries(
    PROFILE_FIELDS.map((field) => {
      const value = draft[field].trim().replace(/\s+/g, " ")
      return [field, value === "" ? null : value]
    })
  ) as CitizenProfileUpdate
}

export function validateProfile(draft: CitizenProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {}
  const update = normalizeDraft(draft)
  for (const field of PROFILE_FIELDS) {
    const value = update[field]
    if (value && value.length > PROFILE_MAX_LENGTHS[field]) {
      errors[field] = `${PROFILE_LABELS[field]} : ${PROFILE_MAX_LENGTHS[field]} caractères au maximum.`
    }
  }
  if (!errors.phone && update.phone && !PHONE_PATTERN.test(update.phone)) {
    errors.phone = "Le numéro de téléphone ne peut contenir que des chiffres, des espaces et les signes + . - ( )."
  }
  // Citizen ne contrôle que la longueur de `preferredLanguage` (≤ 5) : pas de liste fermée ici.
  return errors
}

export const hasNoErrors = (errors: ProfileErrors) => Object.keys(errors).length === 0

/** Même règle que Citizen : prénom, nom et quartier renseignés. */
export const isProfileCompleted = (profile: Pick<CitizenProfile, "firstName" | "lastName" | "district">) =>
  Boolean(profile.firstName && profile.lastName && profile.district)

export const greeting = (profile: Pick<CitizenProfile, "firstName">) =>
  profile.firstName ? `Bonjour ${profile.firstName}` : "Bonjour"
