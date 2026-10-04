import { useRef, useState, type FormEvent } from "react"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useUpdateMyProfileMutation } from "../../../core/application/rtk-api/citizen"
import {
  hasNoErrors,
  PROFILE_FIELDS,
  toDraft,
  validateProfile,
  type CitizenProfile,
  type CitizenProfileDraft,
  type ProfileErrors,
  type ProfileField
} from "../../../core/domain/citizen-profile"

export const profileFieldId = (field: ProfileField) => `profil-${field}`

const isProfileField = (value: string | undefined): value is ProfileField =>
  Boolean(value && (PROFILE_FIELDS as readonly string[]).includes(value))

/**
 * Formulaire du profil. `PUT /api/citizen/me` remplace tout le profil :
 * le brouillon part toujours du profil chargé et les six champs sont envoyés.
 */
export function useProfileForm(profile: CitizenProfile, onSaved: (profile: CitizenProfile) => void) {
  const { logout } = useSession()
  const [update, { isLoading }] = useUpdateMyProfileMutation()
  const [changes, setChanges] = useState<Partial<CitizenProfileDraft>>({})
  const draft = { ...toDraft(profile), ...changes }
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null)
  const submitting = useRef(false)

  const change = (field: ProfileField, value: string) => {
    setChanges((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
    if (status?.tone === "success") setStatus(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const validation = validateProfile(draft)
    setErrors(validation)
    setStatus(null)
    if (!hasNoErrors(validation)) {
      const first = (Object.keys(validation) as ProfileField[])[0]
      setStatus({ tone: "error", message: "Certaines informations sont à corriger." })
      if (first) document.getElementById(profileFieldId(first))?.focus()
      return
    }
    submitting.current = true
    try {
      const saved = await update(draft).unwrap()
      setChanges({})
      setStatus({ tone: "success", message: "Vos informations ont été enregistrées." })
      onSaved(saved)
    } catch (reason) {
      const error = toQueryError(reason)
      if (error?.status === 401) {
        logout()
        return
      }
      if (error?.status === 422 && isProfileField(error.field)) {
        setErrors({ [error.field]: error.data })
        document.getElementById(profileFieldId(error.field))?.focus()
      }
      setStatus({
        tone: "error",
        message: error?.status === "NETWORK_ERROR"
          ? `${error.data} Votre saisie est conservée.`
          : error?.data ?? "L’enregistrement a échoué. Réessayez."
      })
    } finally {
      submitting.current = false
    }
  }

  return { draft, errors, status, isLoading, change, submit }
}
