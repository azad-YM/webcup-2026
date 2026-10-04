import type { Metadata } from "next"
import { EmergencyPage } from "@/modules/public/ui/pages/emergency"

export const metadata: Metadata = { title: "Urgences : numéros, hôpitaux et urgences" }

export default function EmergencyRoute() {
  return <EmergencyPage />
}
