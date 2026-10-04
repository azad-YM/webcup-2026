/**
 * Règles de saisie de l’étape « Mon compte » de l’inscription.
 * Elles guident l’utilisateur avant l’envoi ; Citizen et IAM restent l’autorité
 * (voir le contrat HTTP Citizen, lot L1).
 */
export type RegistrationDraft = {
  email: string
  password: string
  confirmation: string
}

export type RegistrationField = keyof RegistrationDraft
export type RegistrationErrors = Partial<Record<RegistrationField, string>>

export const PASSWORD_MIN_BYTES = 8
export const PASSWORD_MAX_BYTES = 72

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const byteLength = (value: string) => new TextEncoder().encode(value).length

export function validateRegistration(draft: RegistrationDraft): RegistrationErrors {
  const errors: RegistrationErrors = {}
  const email = draft.email.trim()
  if (!email) errors.email = "Indiquez votre adresse e-mail."
  else if (!EMAIL_PATTERN.test(email)) errors.email = "L’adresse e-mail n’est pas valide. Exemple : prenom.nom@exemple.fr"

  const length = byteLength(draft.password)
  if (!draft.password) errors.password = "Choisissez un mot de passe."
  else if (length < PASSWORD_MIN_BYTES) errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN_BYTES} caractères.`
  else if (length > PASSWORD_MAX_BYTES) errors.password = `Le mot de passe est trop long (${PASSWORD_MAX_BYTES} caractères au maximum).`

  if (!draft.confirmation) errors.confirmation = "Confirmez votre mot de passe."
  else if (draft.confirmation !== draft.password) errors.confirmation = "Les deux mots de passe ne correspondent pas."

  return errors
}

export const hasErrors = (errors: RegistrationErrors) => Object.keys(errors).length > 0
