import { Suspense } from "react"
import type { Metadata } from "next"
import { RegistrationPage } from "@/modules/auth/ui/pages/registration"
import { ProfileOnboardingStep } from "@/modules/citizen/ui/sections/profile-onboarding"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Créer un compte" }

/** Composition : l’étape 2 de l’inscription appartient au module citizen. */
export default function InscriptionRoute() {
  return (
    <Suspense fallback={<LoadingState label="Chargement…" />}>
      <RegistrationPage profileStep={<ProfileOnboardingStep />} />
    </Suspense>
  )
}
