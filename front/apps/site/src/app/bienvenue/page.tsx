import type { Metadata } from "next"
import { NewcomerGuidePage } from "@/modules/public/ui/pages/newcomer-guide"

export const metadata: Metadata = { title: "Nouvel arrivant : par où commencer" }

export default function NewcomerGuideRoute() {
  return <NewcomerGuidePage />
}
