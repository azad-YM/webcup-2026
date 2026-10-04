import type { Metadata } from "next"
import { CityAlertsPage } from "@/modules/public/ui/pages/city-alerts"

export const metadata: Metadata = { title: "Alertes et consignes" }

export default function AlertesRoute() {
  return <CityAlertsPage />
}
