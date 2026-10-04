import type { Metadata } from "next"
import { EssentialsPage } from "@/modules/public/ui/pages/essentials"

export const metadata: Metadata = { title: "L’essentiel en cas d’incident" }

export default function EssentielRoute() {
  return <EssentialsPage />
}
