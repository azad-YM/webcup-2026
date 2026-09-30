"use client"
import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useLoginWithCredentialsMutation } from "../../core/application/rtk-api/auth"
import { useSession } from "@/modules/shared/ui/store-provider"
export function LoginPage() {
  const router = useRouter()
  const session = useSession()
  const [login, { isLoading, error }] = useLoginWithCredentialsMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  useEffect(() => {
    if (session.ready && session.hasToken) router.replace("/")
  }, [session.ready, session.hasToken, router])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    try {
      await login({ email: email.trim(), password }).unwrap()
      setPassword("")
      session.refresh()
      router.replace("/")
    } catch {
      /* L’erreur RTK Query est affichée dans le formulaire. */
    }
  }
  if (!session.ready || session.hasToken)
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        role="status"
      >
        Vérification de votre session…
      </main>
    )
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <p className="font-semibold text-emerald-800">Boilerplate</p>
        <h1 className="mt-6 text-3xl font-semibold">Connexion</h1>
        <p className="mt-3 text-slate-600">
          Connectez-vous pour accéder à vos espaces.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>
          {session.storageError && (
            <p role="alert" className="text-sm text-red-700">
              Le stockage du navigateur est indisponible. Autorisez-le pour vous
              connecter.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {"data" in error
                ? error.data
                : "La connexion a échoué. Veuillez réessayer."}
            </p>
          )}
          <button
            disabled={isLoading}
            className="w-full rounded-xl bg-brand-green px-4 py-3 font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  )
}
