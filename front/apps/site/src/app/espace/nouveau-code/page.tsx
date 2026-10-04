import type { Metadata } from "next"
import { NewCodePage } from "@/modules/auth/ui/pages/new-code"

export const metadata: Metadata = { title: "Choisir mon code personnel" }

export default function NewCodeRoute() {
  return <NewCodePage />
}
