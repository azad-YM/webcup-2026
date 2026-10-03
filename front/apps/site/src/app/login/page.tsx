import type { Metadata } from "next"
import { LoginRedirectPage } from "@/modules/auth/ui/pages/login-redirect"

export const metadata: Metadata = { title: "Connexion" }

/** Ancienne adresse conservée pour l’admin, qui redirige encore vers `/login`. */
export default LoginRedirectPage
