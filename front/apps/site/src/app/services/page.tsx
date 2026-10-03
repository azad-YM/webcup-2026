import { Suspense } from "react"
import type { Metadata } from "next"
import { ServicesPage } from "@/modules/public/ui/pages/services"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Services municipaux" }

export default function ServicesRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><ServicesPage /></Suspense>
}
