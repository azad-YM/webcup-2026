import { Suspense } from "react"
import type { Metadata } from "next"
import { NewServiceRequestPage } from "@/modules/citizen/ui/pages/new-service-request"
import { ServiceStatusNoticeFromQuery } from "@/modules/public/ui/components/service-status-notice"

export const metadata: Metadata = { title: "Nouvelle demande" }

/**
 * `?type=contact|report` et `?service=` : `useSearchParams` impose une frontière Suspense en export statique.
 * L'état du service visé (module `public`, F64) est composé ici dans le formulaire (module `citizen`).
 */
export default function Page() {
  return (
    <Suspense>
      <NewServiceRequestPage serviceNotice={<ServiceStatusNoticeFromQuery context="demande" />} />
    </Suspense>
  )
}
