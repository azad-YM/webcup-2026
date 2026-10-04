"use client"
import { useRef, useState, type FormEvent } from "react"
import { MailCheck } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { useResendSignInCodeMutation, useVerifySignInCodeMutation } from "../../core/application/rtk-api/auth"
import { SignInErrorCode, type SignInVerification } from "../../core/application/dto/auth.dto"

/**
 * F53 — seconde étape de la connexion : code à 6 chiffres reçu par e-mail (10 minutes, 5 essais),
 * option « Faire confiance à cet appareil » pendant 30 jours, renvoi limité.
 */
export function SignInVerificationStep({ verification, onSignedIn, onRestart }: {
  verification: SignInVerification
  onSignedIn: () => void
  onRestart: () => void
}) {
  const [verify, { isLoading, error }] = useVerifySignInCodeMutation()
  const [resend, resendState] = useResendSignInCodeMutation()
  const [code, setCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(false)
  const [resent, setResent] = useState<string | null>(null)
  const submitting = useRef(false)
  const failure = toQueryError(error)
  const resendFailure = toQueryError(resendState.error)
  const finished = failure?.code === SignInErrorCode.challengeExpired || failure?.code === SignInErrorCode.tooManyAttempts
  const minutes = Math.round(verification.expiresIn / 60)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    try {
      await verify({ challengeId: verification.challengeId, code: code.replace(/\s/g, ""), trustDevice }).unwrap()
      onSignedIn()
    } catch {
      setCode("")
    } finally {
      submitting.current = false
    }
  }

  async function sendAgain() {
    setResent(null)
    try {
      const result = await resend(verification.challengeId).unwrap()
      setResent(result.remainingSends > 0
        ? `Un nouveau code vient d’être envoyé. Vous pourrez encore en demander ${result.remainingSends}.`
        : "Un nouveau code vient d’être envoyé. C’était le dernier renvoi possible pour cette connexion.")
    } catch { /* message affiché ci-dessous */ }
  }

  return (
    <section aria-labelledby="titre-verification" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <MailCheck className="size-8 text-teal-700" aria-hidden="true" />
      <h2 id="titre-verification" className="mt-4 text-xl font-semibold">Vérification supplémentaire</h2>
      <p className="mt-2 text-slate-700">
        Pour protéger votre compte, nous venons d’envoyer un code à 6 chiffres à <strong>{verification.emailHint}</strong>.
        Ouvrez votre messagerie (pensez aux courriers indésirables) et saisissez ce code. Il est valable {minutes} minutes.
      </p>
      {finished ? (
        <div className="mt-6 space-y-4">
          <FormAnnouncement tone="error">{failure?.data}</FormAnnouncement>
          <button type="button" onClick={onRestart} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800">Recommencer la connexion</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          <TextField
            id="code-verification"
            label="Code reçu par e-mail"
            hint="6 chiffres, sans espace."
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={7}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^0-9 ]/g, ""))}
            error={failure && !finished ? failure.data : undefined}
          />
          <div className="flex items-start gap-3">
            <input id="confiance-appareil" type="checkbox" checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} className="mt-1 size-5" aria-describedby="confiance-appareil-aide" />
            <div>
              <label htmlFor="confiance-appareil" className="font-medium text-slate-900">Faire confiance à cet appareil</label>
              <p id="confiance-appareil-aide" className="text-sm text-slate-600">Le code ne sera plus demandé ici pendant 30 jours. À éviter sur un ordinateur partagé.</p>
            </div>
          </div>
          <button disabled={isLoading || code.replace(/\s/g, "").length !== 6} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
            {isLoading ? "Vérification…" : "Valider le code"}
          </button>
        </form>
      )}
      {!finished && (
        <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
          <FormAnnouncement tone={resendFailure ? "error" : "success"}>{resendFailure ? resendFailure.data : resent}</FormAnnouncement>
          <p className="text-slate-700">Rien reçu après quelques minutes ?</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void sendAgain()} disabled={resendState.isLoading} className="rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-60">
              {resendState.isLoading ? "Envoi…" : "Renvoyer un code"}
            </button>
            <button type="button" onClick={onRestart} className="rounded-xl px-4 py-2 font-medium text-teal-800 underline underline-offset-4">Recommencer la connexion</button>
          </div>
        </div>
      )}
    </section>
  )
}
