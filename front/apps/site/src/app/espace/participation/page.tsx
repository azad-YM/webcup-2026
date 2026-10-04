import { Suspense } from "react"
import type { Metadata } from "next"
import { ParticipationPage } from "@/modules/citizen/ui/pages/participation"
import { ParticipationLinks } from "@/modules/participation/ui/sections/participation-links"

export const metadata: Metadata = { title: "Participer" }

/**
 * Composition : Citizen (soutiens, inquiétudes) et Participation (consultations, idées, contributions) par slot.
 * Les filtres des signalements (F79) lisent l'adresse : `useSearchParams` impose une frontière Suspense en export statique.
 */
export default function EspaceParticipationRoute() {
  return (
    <Suspense>
      <ParticipationPage cityParticipation={<ParticipationLinks />} />
    </Suspense>
  )
}
