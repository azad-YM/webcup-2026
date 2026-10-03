import { Suspense } from "react"
import type { Metadata } from "next"
import { LoginPage } from "@/modules/auth/ui/pages/login"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Connexion" }

export default function ConnexionRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><LoginPage /></Suspense>
}
