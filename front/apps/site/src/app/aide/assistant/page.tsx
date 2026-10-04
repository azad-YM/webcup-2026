import { Suspense } from "react"
import type { Metadata } from "next"
import { AssistantPage } from "@/modules/assistance/ui/pages/assistant"
import { LoadingState } from "@/modules/shared/ui/components/states"

export const metadata: Metadata = { title: "Assistant d’orientation", description: "Décrivez votre besoin, l’assistant vous oriente vers le bon service de Nova Terra." }

export default function AssistantRoute() {
  return <Suspense fallback={<LoadingState label="Chargement…" />}><AssistantPage /></Suspense>
}
