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
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { AUTH_MESSAGES } from "../i18n/auth-messages"
import { ResidentLogin } from "../sections/resident-login"

export function LoginPage() {
  const router = useRouter()
  const session = useSession()
  const params = useSearchParams()
  const returnPath = safeReturnPath(params.get("retour"))
  const accountDeleted = params.get("compte") === "supprime"
  const [login, { isLoading, error }] = useLoginWithCredentialsMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const submitting = useRef(false)
  const t = useMessages(AUTH_MESSAGES)
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
      <PageHeader trail={[{ label: t.loginTitle }]} title={t.loginTitle} lead={t.loginLead} />
      <PageBody narrow>
        {!session.ready || session.hasToken ? (
          <LoadingState label={t.checkingSession} />
        ) : (
          <section aria-labelledby="titre-formulaire-connexion" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {accountDeleted && <div className="mb-6"><FormAnnouncement tone="success">{t.accountDeleted}</FormAnnouncement></div>}
            <h2 id="titre-formulaire-connexion" className="text-xl font-semibold">{t.credentialsTitle}</h2>
            <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
              <TextField id="email" label={t.email} type="email" autoComplete="username" required aria-invalid={failure ? true : undefined} aria-describedby={failure ? "connexion-erreur" : undefined} value={email} onChange={(event) => setEmail(event.target.value)} />
              <TextField id="password" label={t.password} type="password" autoComplete="current-password" required aria-invalid={failure ? true : undefined} aria-describedby={failure ? "connexion-erreur" : undefined} value={password} onChange={(event) => setPassword(event.target.value)} />
              <FormAnnouncement tone="error" id="connexion-erreur">
                {session.storageError
                  ? t.storageUnavailable
                  : failure?.data}
              </FormAnnouncement>
              <button disabled={isLoading} aria-disabled={isLoading} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {isLoading ? t.loggingIn : t.logIn}
              </button>
            </form>
            <p className="mt-6 text-slate-700">
              {t.noAccount}{" "}
              <Link href="/inscription" className="font-medium text-teal-800 underline underline-offset-4">{t.createAccount}</Link>
            </p>
            {/* F71 : habitants accueillis à la mairie, sans adresse e-mail. */}
            <ResidentLogin returnPath={returnPath} />
          </section>
        )}
      </PageBody>
    </>
  )
}
