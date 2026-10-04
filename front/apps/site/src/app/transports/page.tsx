import type { Metadata } from "next"
import { TransportsPage } from "@/modules/public/ui/pages/transports"

export const metadata: Metadata = { title: "Transports et solutions de remplacement" }

export default function TransportsRoute() {
  return <TransportsPage />
}
