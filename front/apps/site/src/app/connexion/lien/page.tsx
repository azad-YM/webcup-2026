import { Suspense } from "react"
import type { Metadata } from "next"
import { LoginLinkPage } from "@/modules/auth/ui/pages/login-link"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Connexion par lien" }

/** D02 : `?jeton=…` (export statique : paramètre d’URL, pas de route dynamique). */
export default function ConnexionLienRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><LoginLinkPage /></Suspense>
}
