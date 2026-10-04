import { Suspense } from "react"
import type { Metadata } from "next"
import { VerifyReceiptPage } from "@/modules/citizen/ui/pages/verify-receipt"

export const metadata: Metadata = { title: "Vérifier un accusé de réception" }

/** F83 : vérification publique (référence + empreinte), sans révéler le contenu. */
export default function Page() {
  return (
    <Suspense>
      <VerifyReceiptPage />
    </Suspense>
  )
}
