"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { Route } from "next"
import { KeyRound, Mail } from "@boilerplate/shared-ui/components/icon"
import { useLoginWithCredentialsMutation, useRequestLoginLinkMutation } from "../../core/application/rtk-api/auth"
import type { SignInVerification } from "../../core/application/dto/auth.dto"
import { safeReturnPath } from "../../core/domain/return-path"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { FormProtection, useProtectedSubmit } from "@boilerplate/shared-ui/components/a11y"
import { siteEnv } from "@/config/env"
import { LoadingState } from "@/modules/shared/ui/components/states"
import { SignInVerificationStep } from "../sections/sign-in-verification"
import { ResidentLogin } from "../sections/resident-login"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { AUTH_MESSAGES } from "../i18n/auth-messages"

type Mode = "password" | "link"

const tabClass = (active: boolean) =>
  `inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition ${active ? "bg-white text-teal-900 shadow-sm" : "text-slate-700 hover:text-slate-950"}`

export function LoginPage() {
  const router = useRouter()
  const session = useSession()
  const params = useSearchParams()
  const returnPath = safeReturnPath(params.get("retour"))
  const t = useMessages(AUTH_MESSAGES)
  const accountDeleted = params.get("compte") === "supprime"
  const signedOutEverywhere = params.get("securite") === "deconnecte"
  const [mode, setMode] = useState<Mode>("password")
  const [verification, setVerification] = useState<SignInVerification | null>(null)
  const verifying = useRef(false)
  useEffect(() => {
    if (session.ready && session.hasToken && !verifying.current) router.replace(returnPath as Route)
  }, [session.ready, session.hasToken, router, returnPath])

  function signedIn() {
    verifying.current = false
    session.refresh()
    router.replace(returnPath as Route)
  }

  return (
    <>
      <PageHeader trail={[{ label: t.loginTitle }]} title={t.loginTitle} lead={t.loginLead} />
      <PageBody narrow>
        {!session.ready || (session.hasToken && !verification) ? (
          <LoadingState label="Vérification de votre session…" />
        ) : verification ? (
          <SignInVerificationStep verification={verification} onSignedIn={signedIn} onRestart={() => { verifying.current = false; setVerification(null) }} />
        ) : (
          <section aria-labelledby="titre-formulaire-connexion" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {accountDeleted && <div className="mb-6"><FormAnnouncement tone="success">Votre compte a été supprimé et vos sessions ont été fermées.</FormAnnouncement></div>}
            {signedOutEverywhere && <div className="mb-6"><FormAnnouncement tone="info">Toutes vos sessions ont été fermées. Reconnectez-vous, puis changez votre mot de passe dans « Sécurité du compte ».</FormAnnouncement></div>}
            <h2 id="titre-formulaire-connexion" className="text-xl font-semibold">Comment souhaitez-vous vous connecter ?</h2>
            <div role="group" aria-label="Méthode de connexion" className="mt-4 flex gap-1 rounded-2xl bg-slate-100 p-1">
              <button type="button" aria-pressed={mode === "password"} onClick={() => setMode("password")} className={tabClass(mode === "password")}>
                <KeyRound className="size-4" aria-hidden="true" /> Mot de passe
              </button>
              <button type="button" aria-pressed={mode === "link"} onClick={() => setMode("link")} className={tabClass(mode === "link")}>
                <Mail className="size-4" aria-hidden="true" /> Lien par e-mail
              </button>
            </div>
            {mode === "password"
              ? <PasswordForm onVerification={(next) => { verifying.current = true; setVerification(next) }} onSignedIn={signedIn} storageError={session.storageError} />
              : <LoginLinkForm />}
            <p className="mt-6 text-slate-700">
              {t.noAccount}{" "}
              <Link href="/inscription" className="font-medium text-teal-800 underline underline-offset-4">{t.createAccount}</Link>
            </p>
            {/* F71 : habitants accueillis à la mairie, sans adresse e-mail. */}
            <ResidentLogin />
          </section>
        )}
      </PageBody>
    </>
  )
}

function PasswordForm({ onVerification, onSignedIn, storageError }: { onVerification: (verification: SignInVerification) => void; onSignedIn: () => void; storageError: boolean }) {
  const [login, { isLoading, error }] = useLoginWithCredentialsMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const submitting = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    try {
      const result = await login({ email: email.trim(), password }).unwrap()
      setPassword("")
      if (result.status === "verification_required") onVerification(result.verification)
      else onSignedIn()
    } catch {
      /* L’erreur RTK Query est affichée dans le formulaire ; la saisie est conservée. */
    } finally {
      submitting.current = false
    }
  }
  const failure = toQueryError(error)
  return (
    <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
      <TextField id="email" label="Adresse e-mail" type="email" autoComplete="username" required aria-invalid={failure ? true : undefined} aria-describedby={failure ? "connexion-erreur" : undefined} value={email} onChange={(event) => setEmail(event.target.value)} />
      <TextField id="password" label="Mot de passe" type="password" autoComplete="current-password" required aria-invalid={failure ? true : undefined} aria-describedby={failure ? "connexion-erreur" : undefined} value={password} onChange={(event) => setPassword(event.target.value)} />
      <FormAnnouncement tone="error" id="connexion-erreur">
        {storageError ? "Le stockage du navigateur est indisponible. Autorisez-le pour vous connecter." : failure?.data}
      </FormAnnouncement>
      <button disabled={isLoading} aria-disabled={isLoading} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
        {isLoading ? "Connexion en cours…" : "Se connecter"}
      </button>
    </form>
  )
}

/** D02 — « Recevoir un lien de connexion par e-mail » : même réponse que le compte existe ou non. */
function LoginLinkForm() {
  const [requestLink, { isLoading, error, data, reset }] = useRequestLoginLinkMutation()
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const submitting = useRef(false)
  // L25 (F81, F82) : protection contre les robots et les envois multiples.
  const guard = useProtectedSubmit({ apiBaseUrl: siteEnv.apiBaseUrl, form: "lien-connexion" })
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || !email.trim()) return
    submitting.current = true
    try {
      await guard.submit({ email: email.trim() }, () => requestLink(email.trim()).unwrap())
      setSentTo(email.trim())
    } catch {
      /* message affiché dans le formulaire */
    } finally {
      submitting.current = false
    }
  }
  const failure = toQueryError(error)
  if (sentTo && data) {
    return (
      <div className="mt-6 space-y-4">
        <FormAnnouncement tone="success">
          <p className="font-semibold">Vérifiez votre messagerie.</p>
          <p className="mt-1">Si un compte Nova Terra utilise l’adresse <strong>{sentTo}</strong>, un lien de connexion vient d’y être envoyé.</p>
        </FormAnnouncement>
        <ul className="list-disc space-y-1 ps-6 text-slate-700">
          <li>Le message s’intitule « Votre lien de connexion à Nova Terra » ; regardez aussi dans les courriers indésirables.</li>
          <li>Le lien est valable {Math.round(data.expiresIn / 60)} minutes et ne sert qu’une fois.</li>
          <li><strong>Ouvrez-le sur cet appareil, dans ce même navigateur</strong> : par sécurité, il ne fonctionne pas ailleurs.</li>
        </ul>
        <button type="button" onClick={() => { setSentTo(null); reset() }} className="font-medium text-teal-800 underline underline-offset-4">Utiliser une autre adresse ou renvoyer un lien</button>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
      <p className="text-slate-700">
        Pas besoin de mot de passe : indiquez votre adresse e-mail, nous vous envoyons un lien qui vous connecte en un clic.
        Il est valable 10 minutes et doit être ouvert dans ce navigateur.
      </p>
      <p className="text-sm text-slate-600">Votre compte a été créé à l’accueil de la mairie sans adresse e-mail ? Le lien n’est pas disponible : connectez-vous avec votre mot de passe.</p>
      <TextField id="email-lien" label="Adresse e-mail" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} error={guard.refusal ?? failure?.data} />
      <FormProtection guard={guard} />
      <button disabled={isLoading || guard.submitting || !email.trim()} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
        {isLoading ? "Envoi en cours…" : "Recevoir un lien de connexion par e-mail"}
      </button>
    </form>
  )
}
