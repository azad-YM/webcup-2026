import { Suspense } from "react"
import type { Metadata } from "next"
import { ProjectDetailPage } from "@/modules/participation/ui/pages/project-detail"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Projet" }

export default function ProjetRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><ProjectDetailPage /></Suspense>
}
