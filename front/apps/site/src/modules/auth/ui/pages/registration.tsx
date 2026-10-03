"use client"
import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { LoadingState } from "@/modules/shared/ui/components/states"
import { RegistrationForm } from "../sections/registration-form/registration-form"

const STEPS = ["Mon compte", "Mes informations"] as const

function Stepper({ current }: { current: 1 | 2 }) {
  return (
    <ol aria-label="Étapes de l’inscription" className="mt-6 flex flex-wrap gap-3">
      {STEPS.map((label, index) => {
        const step = index + 1
        const state = step === current ? "current" : step < current ? "done" : "todo"
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${state === "current" ? "bg-teal-700 text-white" : state === "done" ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-700"}`}
          >
            <span>Étape {step} sur {STEPS.length} :</span> {label}
            {state === "done" && <span className="sr-only">(terminée)</span>}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Inscription en deux étapes. L’étape 2 (« Mes informations ») est fournie par
 * la composition (`profileStep`) : elle appartient au module citizen.
 */
export function RegistrationPage({ profileStep }: { profileStep: ReactNode }) {
  const router = useRouter()
  const session = useSession()
  const step: 1 | 2 = useSearchParams().get("etape") === "informations" ? 2 : 1
  // Évite de renvoyer vers l’espace pendant le passage de l’étape 1 à l’étape 2.
  const [justRegistered, setJustRegistered] = useState(false)

  useEffect(() => {
    if (!session.ready) return
    if (step === 1 && session.hasToken && !justRegistered) router.replace("/espace")
    if (step === 2 && !session.hasToken) router.replace("/inscription")
  }, [session.ready, session.hasToken, step, justRegistered, router])

  const onRegistered = () => {
    setJustRegistered(true)
    session.refresh()
    router.replace("/inscription?etape=informations")
  }

  const waiting = !session.ready || (step === 1 && session.hasToken) || (step === 2 && !session.hasToken)

  return (
    <>
      <PageHeader
        trail={step === 1 ? [{ label: "Créer un compte" }] : [{ label: "Créer un compte", href: "/inscription" }, { label: "Mes informations" }]}
        title={step === 1 ? "Créer mon compte citoyen" : "Mes informations"}
        lead={step === 1
          ? "En créant votre compte, vous devenez citoyen de Nova Terra et retrouvez vos démarches dans votre espace personnel."
          : "Votre compte est créé et vous êtes connecté. Ces informations sont facultatives : vous pourrez les compléter plus tard."}
      >
        <Stepper current={step} />
      </PageHeader>
      <PageBody narrow>
        {waiting ? (
          <LoadingState label="Vérification de votre session…" />
        ) : step === 1 ? (
          <section aria-labelledby="titre-etape-compte" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 id="titre-etape-compte" className="text-xl font-semibold">Étape 1 : mon compte</h2>
            <p className="mt-2 text-slate-700">Tous les champs sont obligatoires.</p>
            <div className="mt-6"><RegistrationForm onRegistered={onRegistered} /></div>
            <p className="mt-6 text-slate-700">
              Vous avez déjà un compte ?{" "}
              <Link href="/connexion" className="font-medium text-teal-800 underline underline-offset-4">Se connecter</Link>
            </p>
          </section>
        ) : (
          profileStep
        )}
      </PageBody>
    </>
  )
}
