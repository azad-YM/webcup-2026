"use client"
import Link from "next/link"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_BYTES } from "../../../core/domain/registration"
import { REGISTRATION_FIELD_ID, useRegistrationForm } from "./registration-form.hook"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { format } from "@/modules/shared/core/i18n/locales"
import { AUTH_MESSAGES } from "../../i18n/auth-messages"

/** Étape 1 de l’inscription : adresse e-mail et mot de passe. */
export function RegistrationForm({ onRegistered }: { onRegistered: () => void }) {
  const { draft, errors, failure, isLoading, update, submit } = useRegistrationForm(onRegistered)
  const t = useMessages(AUTH_MESSAGES)
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <TextField
        id={REGISTRATION_FIELD_ID.email}
        label={t.email}
        type="email"
        autoComplete="email"
        required
        value={draft.email}
        error={errors.email}
        hint={t.emailHint}
        onChange={(event) => update("email", event.target.value)}
      />
      <TextField
        id={REGISTRATION_FIELD_ID.password}
        label={t.password}
        type="password"
        autoComplete="new-password"
        required
        value={draft.password}
        error={errors.password}
        hint={format(t.passwordHint, { min: PASSWORD_MIN_BYTES, max: PASSWORD_MAX_BYTES })}
        onChange={(event) => update("password", event.target.value)}
      />
      <TextField
        id={REGISTRATION_FIELD_ID.confirmation}
        label={t.passwordConfirmation}
        type="password"
        autoComplete="new-password"
        required
        value={draft.confirmation}
        error={errors.confirmation}
        onChange={(event) => update("confirmation", event.target.value)}
      />
      <FormAnnouncement tone="error">
        {failure && (
          <>
            <p>{failure.message}</p>
            {failure.suggestLogin && (
              <p className="mt-2">
                <Link href="/connexion" className="font-medium underline underline-offset-4">{t.loginWithEmail}</Link>
              </p>
            )}
          </>
        )}
      </FormAnnouncement>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {isLoading ? t.creating : t.create}
      </button>
    </form>
  )
}
