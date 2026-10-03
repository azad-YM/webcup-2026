"use client"
import type { ReactNode } from "react"
import { FormAnnouncement, SelectField, TextField } from "@/modules/shared/ui/components/form-field"
import { PREFERRED_LANGUAGES, PROFILE_LABELS, PROFILE_MAX_LENGTHS, type CitizenProfile } from "../../../core/domain/citizen-profile"
import { profileFieldId, useProfileForm } from "./profile-form.hook"

const LANGUAGE_OPTIONS = PREFERRED_LANGUAGES.map((language) => ({ value: language.code, label: language.label }))

export function ProfileForm({ profile, submitLabel, onSaved, secondaryAction, successExtra }: {
  profile: CitizenProfile
  submitLabel: string
  onSaved: (profile: CitizenProfile) => void
  secondaryAction?: ReactNode
  successExtra?: ReactNode
}) {
  const { draft, errors, status, isLoading, change, submit } = useProfileForm(profile, onSaved)
  const text = (field: "firstName" | "lastName" | "phone" | "address" | "district", props: { autoComplete: string; type?: string; hint?: string }) => (
    <TextField
      id={profileFieldId(field)}
      label={PROFILE_LABELS[field]}
      optional
      type={props.type ?? "text"}
      autoComplete={props.autoComplete}
      hint={props.hint}
      maxLength={PROFILE_MAX_LENGTHS[field]}
      value={draft[field]}
      error={errors[field]}
      onChange={(event) => change(field, event.target.value)}
    />
  )
  // Language selection keeps an unknown stored value visible instead of erasing it.
  const languageOptions = draft.preferredLanguage && !LANGUAGE_OPTIONS.some((option) => option.value === draft.preferredLanguage)
    ? [...LANGUAGE_OPTIONS, { value: draft.preferredLanguage, label: draft.preferredLanguage }]
    : LANGUAGE_OPTIONS
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">Identité</legend>
        {text("firstName", { autoComplete: "given-name" })}
        {text("lastName", { autoComplete: "family-name" })}
      </fieldset>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-semibold">Coordonnées</legend>
        {text("phone", { autoComplete: "tel", type: "tel", hint: "Pour que les services puissent vous recontacter." })}
        {text("district", { autoComplete: "address-level3", hint: "Pour recevoir les informations et alertes de votre quartier." })}
        <div className="sm:col-span-2">{text("address", { autoComplete: "street-address" })}</div>
      </fieldset>
      <fieldset>
        <legend className="mb-4 text-lg font-semibold">Préférences</legend>
        <SelectField
          id={profileFieldId("preferredLanguage")}
          label={PROFILE_LABELS.preferredLanguage}
          optional
          placeholder="Non précisée"
          options={languageOptions}
          value={draft.preferredLanguage}
          error={errors.preferredLanguage}
          onChange={(event) => change("preferredLanguage", event.target.value)}
        />
      </fieldset>
      <FormAnnouncement tone={status?.tone ?? "info"}>
        {status && (
          <>
            <p className="font-medium">{status.message}</p>
            {status.tone === "success" && successExtra}
          </>
        )}
      </FormAnnouncement>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isLoading} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isLoading ? "Enregistrement…" : submitLabel}
        </button>
        {secondaryAction}
      </div>
    </form>
  )
}
