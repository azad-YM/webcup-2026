import { Suspense } from "react"
import type { Metadata } from "next"
import { ServiceRequestsPage } from "@/modules/citizen/ui/pages/service-requests"

export const metadata: Metadata = { title: "Mes demandes" }

/** Liste et détail (`?ref=`) : `useSearchParams` impose une frontière Suspense en export statique. */
export default function Page() {
  return (
    <Suspense>
      <ServiceRequestsPage />
    </Suspense>
  )
}
