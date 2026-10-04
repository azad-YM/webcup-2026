import { Suspense } from "react"
import type { Metadata } from "next"
import { ConsultationPage } from "@/modules/participation/ui/pages/consultation"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Consultation" }

export default function ConsultationRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><ConsultationPage /></Suspense>
}
