import { Suspense } from "react"
import type { Metadata } from "next"
import { RequestReceiptPage } from "@/modules/citizen/ui/pages/request-receipt"

export const metadata: Metadata = { title: "Accusé de réception" }

/** F83 : accusé de réception (`?ref=`) ; `useSearchParams` impose une frontière Suspense en export statique. */
export default function Page() {
  return (
    <Suspense>
      <RequestReceiptPage />
    </Suspense>
  )
}
