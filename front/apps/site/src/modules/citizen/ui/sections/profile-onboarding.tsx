"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ProfileForm } from "./profile-form/profile-form"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"

/** Étape 2 de l’inscription : « Mes informations », que l’on peut passer. */
export function ProfileOnboardingStep() {
  const router = useRouter()
  const access = useCitizenAccess({ refreshProfile: true })
  if (!access.profile) return <CitizenAccessState access={access} returnTo="/espace/profil" />
  return (
    <section aria-labelledby="titre-etape-informations" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 id="titre-etape-informations" className="text-xl font-semibold">Étape 2 : mes informations</h2>
      <p className="mt-2 text-slate-700">
        Tous les champs sont facultatifs. Prénom, nom et quartier permettent de personnaliser votre espace et de vous informer de ce qui concerne votre quartier.
      </p>
      <div className="mt-6">
        <ProfileForm
          profile={access.profile}
          submitLabel="Enregistrer et accéder à mon espace"
          onSaved={() => router.push("/espace")}
          secondaryAction={
            <Link href="/espace" className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900 hover:bg-slate-50">
              Passer cette étape
            </Link>
          }
        />
      </div>
    </section>
  )
}
