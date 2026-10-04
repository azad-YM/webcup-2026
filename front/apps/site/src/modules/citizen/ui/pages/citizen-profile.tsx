"use client"
import Link from "next/link"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { DeleteAccount } from "../sections/delete-account"
import { ProfileForm } from "../sections/profile-form/profile-form"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"

export function CitizenProfilePage() {
  const access = useCitizenAccess({ refreshProfile: true })
  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace", href: "/espace" }, { label: "Mon profil" }]}
        title="Mon profil"
        lead="Ces informations sont facultatives. Elles aident les services de la ville à vous répondre et à vous informer."
      />
      <PageBody narrow>
        {access.profile ? (
          <><section aria-label="Formulaire du profil" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ProfileForm
              profile={access.profile}
              submitLabel="Enregistrer mes informations"
              onSaved={() => undefined}
              successExtra={<p className="mt-2"><Link href="/espace" className="underline underline-offset-4">Retour à mon espace</Link></p>}
            />
          </section><DeleteAccount /></>
        ) : (
          <CitizenAccessState access={access} returnTo="/espace/profil" />
        )}
      </PageBody>
    </>
  )
}
