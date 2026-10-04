"use client"
import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { LoadingState } from "@/modules/shared/ui/components/states"
import { RegistrationForm } from "../sections/registration-form/registration-form"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { format } from "@/modules/shared/core/i18n/locales"
import { AUTH_MESSAGES } from "../i18n/auth-messages"

function Stepper({ current }: { current: 1 | 2 }) {
  const t = useMessages(AUTH_MESSAGES)
  const STEPS = [t.stepAccount, t.infoTitle]
  return (
    <ol aria-label={t.stepsLabel} className="mt-6 flex flex-wrap gap-3">
      {STEPS.map((label, index) => {
        const step = index + 1
        const state = step === current ? "current" : step < current ? "done" : "todo"
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${state === "current" ? "bg-teal-700 text-white" : state === "done" ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-700"}`}
          >
            <span>{format(t.stepOf, { step, total: STEPS.length })}</span> {label}
            {state === "done" && <span className="sr-only">{t.stepDone}</span>}
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
  const t = useMessages(AUTH_MESSAGES)
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
        trail={step === 1 ? [{ label: t.registerTrail }] : [{ label: t.registerTrail, href: "/inscription" }, { label: t.infoTitle }]}
        title={step === 1 ? t.registerTitle : t.infoTitle}
        lead={step === 1 ? t.registerLead : t.infoLead}
      >
        <Stepper current={step} />
      </PageHeader>
      <PageBody narrow>
        {waiting ? (
          <LoadingState label={t.checkingSession} />
        ) : step === 1 ? (
          <section aria-labelledby="titre-etape-compte" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 id="titre-etape-compte" className="text-xl font-semibold">{t.step1Title}</h2>
            <p className="mt-2 text-slate-700">{t.allRequired}</p>
            <div className="mt-6"><RegistrationForm onRegistered={onRegistered} /></div>
            <p className="mt-6 text-slate-700">
              {t.haveAccount}{" "}
              <Link href="/connexion" className="font-medium text-teal-800 underline underline-offset-4">{t.logIn}</Link>
            </p>
          </section>
        ) : (
          profileStep
        )}
      </PageBody>
    </>
  )
}
