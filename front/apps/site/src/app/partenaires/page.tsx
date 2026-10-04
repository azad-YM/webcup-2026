import { Suspense } from "react"
import type { Metadata } from "next"
import { PartnersPage } from "@/modules/public/ui/pages/partners"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Associations partenaires" }

export default function PartenairesRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><PartnersPage /></Suspense>
}
