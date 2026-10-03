import type { Metadata } from "next"
import { CitizenHomePage } from "@/modules/citizen/ui/pages/citizen-home"
import { SpacesList } from "@/modules/auth/ui/components/spaces-list"
import { CitizenNotifications } from "@/modules/public/ui/sections/alerts"

export const metadata: Metadata = { title: "Mon espace" }

/**
 * Composition : les espaces IAM (carte « Administration ») viennent du module auth,
 * les notifications de la ville (alertes, annonces importantes) du module public.
 */
export default function EspaceRoute() {
  return (
    <>
      <CitizenHomePage spaces={<SpacesList variant="compact" />} spacesForNonCitizen={<SpacesList />} />
      <CitizenNotifications />
    </>
  )
}
