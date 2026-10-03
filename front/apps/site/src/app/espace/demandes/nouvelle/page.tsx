import { Suspense } from "react"
import type { Metadata } from "next"
import { NewServiceRequestPage } from "@/modules/citizen/ui/pages/new-service-request"

export const metadata: Metadata = { title: "Nouvelle demande" }

/** `?type=contact|report` : `useSearchParams` impose une frontière Suspense en export statique. */
export default function Page() {
  return (
    <Suspense>
      <NewServiceRequestPage />
    </Suspense>
  )
}
