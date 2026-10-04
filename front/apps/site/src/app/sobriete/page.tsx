import type { Metadata } from "next"
import { SobrietyPage } from "@/modules/public/ui/pages/sobriety"

export const metadata: Metadata = {
  title: "Une plateforme plus légère",
  description: "Ce que Nova Terra fait pour alléger son site : pages plus légères, mode léger, connexion lente et hors ligne.",
  alternates: { canonical: "/sobriete" }
}

export default SobrietyPage
