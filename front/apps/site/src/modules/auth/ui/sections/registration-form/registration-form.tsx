"use client"
import Link from "next/link"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_BYTES } from "../../../core/domain/registration"
import { REGISTRATION_FIELD_ID, useRegistrationForm } from "./registration-form.hook"

/** Étape 1 de l’inscription : adresse e-mail et mot de passe. */
export function RegistrationForm({ onRegistered }: { onRegistered: () => void }) {
  const { draft, errors, failure, isLoading, update, submit } = useRegistrationForm(onRegistered)
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <TextField
        id={REGISTRATION_FIELD_ID.email}
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        required
        value={draft.email}
        error={errors.email}
        hint="Elle vous servira d’identifiant pour vous connecter."
        onChange={(event) => update("email", event.target.value)}
      />
      <TextField
        id={REGISTRATION_FIELD_ID.password}
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        required
        value={draft.password}
        error={errors.password}
        hint={`Entre ${PASSWORD_MIN_BYTES} et ${PASSWORD_MAX_BYTES} caractères.`}
        onChange={(event) => update("password", event.target.value)}
      />
      <TextField
        id={REGISTRATION_FIELD_ID.confirmation}
        label="Confirmation du mot de passe"
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
                <Link href="/connexion" className="font-medium underline underline-offset-4">Se connecter avec cet e-mail</Link>
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
        {isLoading ? "Création du compte…" : "Créer mon compte"}
      </button>
    </form>
  )
}
