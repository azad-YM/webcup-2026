import type { Metadata } from "next"
import { ServiceRequestsSummaryPage } from "@/modules/citizen/ui/pages/service-requests-summary"

export const metadata: Metadata = { title: "Récapitulatif de mes demandes" }

/** F56 : récapitulatif imprimable et téléchargeable (CSV) de « Mes demandes ». */
export default ServiceRequestsSummaryPage
