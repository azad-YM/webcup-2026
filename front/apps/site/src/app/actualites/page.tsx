import { Suspense } from "react"
import type { Metadata } from "next"
import { PublicationsPage } from "@/modules/public/ui/pages/publications"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Actualités" }

export default function ActualitesRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><PublicationsPage /></Suspense>
}
