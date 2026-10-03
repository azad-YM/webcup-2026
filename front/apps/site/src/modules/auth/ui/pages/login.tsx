"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { Route } from "next"
import { useLoginWithCredentialsMutation } from "../../core/application/rtk-api/auth"
import { safeReturnPath } from "../../core/domain/return-path"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { LoadingState } from "@/modules/shared/ui/components/states"

export function LoginPage() {
  const router = useRouter()
  const session = useSession()
  const returnPath = safeReturnPath(useSearchParams().get("retour"))
  const [login, { isLoading, error }] = useLoginWithCredentialsMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const submitting = useRef(false)
  useEffect(() => {
    if (session.ready && session.hasToken) router.replace(returnPath as Route)
  }, [session.ready, session.hasToken, router, returnPath])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    try {
      await login({ email: email.trim(), password }).unwrap()
      setPassword("")
      session.refresh()
      router.replace(returnPath as Route)
    } catch {
      /* L’erreur RTK Query est affichée dans le formulaire ; la saisie est conservée. */
    } finally {
      submitting.current = false
    }
  }
  const failure = toQueryError(error)
  return (
    <>
      <PageHeader trail={[{ label: "Connexion" }]} title="Connexion" lead="Connectez-vous pour retrouver votre espace citoyen et vos démarches." />
      <PageBody narrow>
        {!session.ready || session.hasToken ? (
          <LoadingState label="Vérification de votre session…" />
        ) : (
          <section aria-labelledby="titre-formulaire-connexion" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 id="titre-formulaire-connexion" className="text-xl font-semibold">Vos identifiants</h2>
            <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
              <TextField id="email" label="Adresse e-mail" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
              <TextField id="password" label="Mot de passe" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              <FormAnnouncement tone="error">
                {session.storageError
                  ? "Le stockage du navigateur est indisponible. Autorisez-le pour vous connecter."
                  : failure?.data}
              </FormAnnouncement>
              <button disabled={isLoading} aria-disabled={isLoading} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {isLoading ? "Connexion en cours…" : "Se connecter"}
              </button>
            </form>
            <p className="mt-6 text-slate-700">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="font-medium text-teal-800 underline underline-offset-4">Créer mon compte citoyen</Link>
            </p>
          </section>
        )}
      </PageBody>
    </>
  )
}
