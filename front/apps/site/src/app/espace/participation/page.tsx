import type { Metadata } from "next"
import { ParticipationPage } from "@/modules/citizen/ui/pages/participation"
import { ParticipationLinks } from "@/modules/participation/ui/sections/participation-links"

export const metadata: Metadata = { title: "Participer" }

/** Composition : Citizen (soutiens, inquiétudes) et Participation (consultations, idées, contributions) par slot. */
export default function EspaceParticipationRoute() {
  return <ParticipationPage cityParticipation={<ParticipationLinks />} />
}
