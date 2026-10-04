"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { useAccountAccessStatusQuery, useChangeMyCodeMutation } from "../../core/application/rtk-api/resident-access"
import { AUTH_MESSAGES } from "../i18n/auth-messages"

/** F71 : première connexion d’un habitant accueilli à la mairie — remplacer le code provisoire. */
export function NewCodePage() {
  const t = useMessages(AUTH_MESSAGES)
  const router = useRouter()
  const session = useSession()
  const status = useAccountAccessStatusQuery(undefined, { skip: !session.ready || !session.hasToken })
  const [change, mutation] = useChangeMyCodeMutation()
  const [form, setForm] = useState({ current: "", next: "", confirmation: "" })
  const [errors, setErrors] = useState<{ next?: string; confirmation?: string }>({})
  const [saved, setSaved] = useState(false)
  const savedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (session.ready && !session.hasToken) router.replace("/connexion?retour=/espace/nouveau-code")
  }, [session.ready, session.hasToken, router])
  useEffect(() => { if (saved) savedRef.current?.focus() }, [saved])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isLoading) return
    const nextErrors = {
      next: new TextEncoder().encode(form.next).length < 8 ? t.codeTooShort : undefined,
      confirmation: form.next !== form.confirmation ? t.codesDiffer : undefined
    }
    setErrors(nextErrors)
    if (nextErrors.next || nextErrors.confirmation) return
    try {
      await change({ currentPassword: form.current, newPassword: form.next }).unwrap()
      setForm({ current: "", next: "", confirmation: "" })
      setSaved(true)
    } catch { /* erreur affichée */ }
  }
  const failure = toQueryError(mutation.error)
  return (
    <>
      <PageHeader trail={[{ label: t.newCodeTitle }]} title={t.newCodeTitle} lead={t.newCodeLead} />
      <PageBody narrow>
        {!session.ready || !session.hasToken || status.isLoading ? (
          <LoadingState label={t.checkingSession} />
        ) : status.isError ? (
          <ErrorState message={toQueryError(status.error)?.data ?? t.checkingSession} onRetry={() => void status.refetch()} retrying={status.isFetching} />
        ) : saved || !status.data?.passwordChangeRequired ? (
          <div ref={savedRef} tabIndex={-1} role="status" className="rounded-3xl border border-teal-200 bg-teal-50 p-6 text-teal-950">
            <p className="text-lg font-semibold">{saved ? t.codeSaved : t.notRequired}</p>
            <p className="mt-4 flex flex-wrap gap-3">
              <Link href="/bienvenue" className="rounded-xl bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">{t.whereToStart}</Link>
              <Link href="/espace" className="rounded-xl border border-teal-700 px-4 py-2 font-medium text-teal-900 hover:bg-white">{t.goToSpace}</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="font-medium text-slate-800" dir="ltr">{status.data.residentId}</p>
            <TextField id="code-actuel" label={t.currentCode} type="password" autoComplete="current-password" dir="ltr" required value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} />
            <TextField id="nouveau-code" label={t.newCode} hint={t.newCodeHint} type="password" autoComplete="new-password" dir="ltr" required error={errors.next} value={form.next} onChange={(event) => setForm({ ...form, next: event.target.value })} />
            <TextField id="confirmation-code" label={t.confirmCode} type="password" autoComplete="new-password" dir="ltr" required error={errors.confirmation} value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} />
            <FormAnnouncement tone="error">{failure?.data}</FormAnnouncement>
            <button disabled={mutation.isLoading} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
              {mutation.isLoading ? t.savingCode : t.saveCode}
            </button>
          </form>
        )}
      </PageBody>
    </>
  )
}
