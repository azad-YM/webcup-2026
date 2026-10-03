import { Suspense } from "react"
import type { Metadata } from "next"
import { AppointmentsPage } from "@/modules/citizen/ui/pages/appointments"

export const metadata: Metadata = { title: "Mes rendez-vous" }

/** `?id=` met en avant un rendez-vous (lien d'un rappel) : `useSearchParams` impose une frontière Suspense. */
export default function Page() {
  return (
    <Suspense>
      <AppointmentsPage />
    </Suspense>
  )
}
