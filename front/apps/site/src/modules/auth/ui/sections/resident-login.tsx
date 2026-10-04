"use client"
import { useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { useLoginAsResidentMutation } from "../../core/application/rtk-api/resident-access"
import { AUTH_MESSAGES } from "../i18n/auth-messages"

/**
 * F71 : « Je n’ai pas d’adresse e-mail » — connexion par identifiant d’habitant et code.
 * Avec un code provisoire, l’habitant est conduit à choisir son code personnel.
 */
export function ResidentLogin({ returnPath }: { returnPath: string }) {
  const t = useMessages(AUTH_MESSAGES)
  const router = useRouter()
  const session = useSession()
  const [login, { isLoading, error }] = useLoginAsResidentMutation()
  const [residentId, setResidentId] = useState("")
  const [code, setCode] = useState("")
  const submitting = useRef(false)
  const failure = toQueryError(error)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    try {
      const result = await login({ residentId, code }).unwrap()
      setCode("")
      session.refresh()
      router.replace((result.passwordChangeRequired ? "/espace/nouveau-code" : returnPath) as Route)
    } catch {
      /* L’erreur est affichée dans le formulaire. */
    } finally {
      submitting.current = false
    }
  }
  return (
    <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <summary className="cursor-pointer text-lg font-semibold text-slate-950">{t.noEmail}</summary>
      <p className="mt-3 text-slate-700">{t.noEmailLead}</p>
      <form onSubmit={submit} className="mt-5 space-y-5" noValidate>
        <TextField id="identifiant-habitant" label={t.residentId} hint={t.residentIdHint} autoComplete="username" autoCapitalize="characters" spellCheck={false} dir="ltr" required aria-invalid={failure ? true : undefined} aria-describedby={failure ? "habitant-erreur" : undefined} value={residentId} onChange={(event) => setResidentId(event.target.value)} />
        <TextField id="code-habitant" label={t.code} hint={t.codeHint} type="password" autoComplete="current-password" dir="ltr" required aria-invalid={failure ? true : undefined} aria-describedby={failure ? "habitant-erreur" : undefined} value={code} onChange={(event) => setCode(event.target.value)} />
        <FormAnnouncement tone="error" id="habitant-erreur">{failure?.data}</FormAnnouncement>
        <button disabled={isLoading || !residentId.trim() || !code.trim()} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
          {isLoading ? t.loggingIn : t.residentLogIn}
        </button>
      </form>
    </details>
  )
}
