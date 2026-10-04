import { Suspense } from "react"
import type { Metadata } from "next"
import { ServiceReviewPage } from "@/modules/participation/ui/pages/service-review"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Donner mon avis sur un service" }

export default function AvisRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><ServiceReviewPage /></Suspense>
}
