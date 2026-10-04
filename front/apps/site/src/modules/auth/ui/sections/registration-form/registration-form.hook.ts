import { useRef, useState, type FormEvent } from "react"
import { SubmissionRefusedError, useProtectedSubmit } from "@boilerplate/shared-ui/components/a11y"
import { siteEnv } from "@/config/env"
import { useRegisterAccountMutation } from "../../../core/application/rtk-api/auth"
import { RegistrationErrorCode } from "../../../core/application/dto/auth.dto"
import { hasErrors, validateRegistration, type RegistrationDraft, type RegistrationErrors, type RegistrationField } from "../../../core/domain/registration"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"

export const REGISTRATION_FIELD_ID: Record<RegistrationField, string> = {
  email: "inscription-email",
  password: "inscription-mot-de-passe",
  confirmation: "inscription-confirmation"
}

export type RegistrationFailure = { message: string; suggestLogin: boolean }

const focusField = (field: RegistrationField) => document.getElementById(REGISTRATION_FIELD_ID[field])?.focus()

export function useRegistrationForm(onRegistered: () => void) {
  const [register, { isLoading }] = useRegisterAccountMutation()
  const [draft, setDraft] = useState<RegistrationDraft>({ email: "", password: "", confirmation: "" })
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [failure, setFailure] = useState<RegistrationFailure | null>(null)
  const submitting = useRef(false)
  // L25 (F81, F82) : protection contre les robots et les envois multiples.
  const guard = useProtectedSubmit({ apiBaseUrl: siteEnv.apiBaseUrl, form: "inscription" })

  const update = (field: RegistrationField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const validation = validateRegistration(draft)
    setErrors(validation)
    setFailure(null)
    if (hasErrors(validation)) {
      const first = (Object.keys(validation) as RegistrationField[])[0]
      if (first) focusField(first)
      return
    }
    submitting.current = true
    try {
      const payload = { email: draft.email, password: draft.password }
      await guard.submit(payload, () => register(payload).unwrap())
      setDraft((current) => ({ ...current, password: "", confirmation: "" }))
      onRegistered()
    } catch (reason) {
      if (reason instanceof SubmissionRefusedError) {
        setFailure({ message: reason.message, suggestLogin: false })
        return
      }
      const error = toQueryError(reason)
      if (error?.code === RegistrationErrorCode.invalidRegistration && (error.field === "email" || error.field === "password")) {
        setErrors({ [error.field]: error.data })
        focusField(error.field)
        return
      }
      setFailure({
        message: error?.status === "NETWORK_ERROR"
          ? `${error.data} Vos informations sont conservées.`
          : error?.data ?? "L’inscription n’a pas abouti. Réessayez.",
        suggestLogin: error?.code === RegistrationErrorCode.accountAlreadyExists || error?.code === RegistrationErrorCode.createdButNotSignedIn
      })
    } finally {
      submitting.current = false
    }
  }

  return { draft, errors, failure, isLoading: isLoading || guard.submitting, update, submit, guard }
}
