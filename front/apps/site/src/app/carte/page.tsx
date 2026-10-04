import { Suspense } from "react"
import type { Metadata } from "next"
import { ServicesMapPage } from "@/modules/public/ui/pages/services-map"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Carte des services" }

export default function ServicesMapRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><ServicesMapPage /></Suspense>
}
