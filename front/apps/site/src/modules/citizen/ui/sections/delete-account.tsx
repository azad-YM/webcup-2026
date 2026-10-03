"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useDeleteMyAccountMutation } from "../../core/application/rtk-api/citizen"

export function DeleteAccount() {
  const [opened, setOpened] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [password, setPassword] = useState("")
  const [remove, result] = useDeleteMyAccountMutation()
  const { logout } = useSession()
  const router = useRouter()
  const error = toQueryError(result.error)
  const openButton = useRef<HTMLButtonElement>(null)
  const passwordField = useRef<HTMLInputElement>(null)
  const restoreFocus = useRef(false)
  // Ouverture : focus sur le mot de passe ; annulation : retour au bouton d’origine.
  useEffect(() => {
    if (opened) passwordField.current?.focus()
    else if (restoreFocus.current) openButton.current?.focus()
  }, [opened])
  useEffect(() => { if (error?.status === 401) logout() }, [error?.status, logout])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!confirmed || result.isLoading) return
    try {
      await remove(password).unwrap()
      setPassword("")
      logout()
      router.replace("/connexion?compte=supprime")
    } catch { setPassword("") }
  }
  return <section className="mt-8 rounded-3xl border border-red-200 bg-white p-6 sm:p-8" aria-labelledby="delete-title">
    <h2 id="delete-title" className="text-xl font-semibold">Supprimer mon compte</h2>
    <p className="mt-2 text-slate-700">La suppression est définitive. Votre profil et vos identifiants seront effacés, et vos sessions seront fermées. L’historique de vos demandes reste conservé par la mairie.</p>
    {!opened ? <button ref={openButton} type="button" aria-expanded={false} aria-controls="delete-form" className="mt-4 rounded-xl border border-red-700 px-4 py-3 text-red-800" onClick={() => setOpened(true)}>Demander la suppression</button> :
      <form id="delete-form" aria-labelledby="delete-title" onSubmit={(event) => void submit(event)} className="mt-4 space-y-4">
        <label className="block" htmlFor="delete-password">Mot de passe actuel</label>
        <input ref={passwordField} id="delete-password" type="password" aria-invalid={error ? true : undefined} aria-describedby={error ? "delete-error" : undefined} autoComplete="current-password" required maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-400 px-4 py-3" />
        <label className="flex items-start gap-3"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} required className="mt-1" />Je comprends que cette suppression est définitive.</label>
        {error && <p id="delete-error" role="alert" className="font-medium text-red-800"><span className="sr-only">Erreur : </span>{error.data}</p>}
        <div className="flex gap-3"><button type="submit" disabled={!confirmed || !password || result.isLoading} className="rounded-xl bg-red-800 px-4 py-3 text-white disabled:opacity-50">{result.isLoading ? "Suppression…" : "Supprimer définitivement"}</button>
        <button type="button" disabled={result.isLoading} onClick={() => { restoreFocus.current = true; setOpened(false); setPassword(""); setConfirmed(false); result.reset() }} className="rounded-xl border px-4 py-3">Annuler</button></div>
      </form>}
  </section>
}
