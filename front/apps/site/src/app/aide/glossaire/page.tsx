import type { Metadata } from "next"
import { GlossaryPage } from "@/modules/public/ui/pages/glossary"

export const metadata: Metadata = { title: "Glossaire", description: "Les mots du portail de Nova Terra expliqués simplement." }

export default function GlossaryRoute() {
  return <GlossaryPage />
}
