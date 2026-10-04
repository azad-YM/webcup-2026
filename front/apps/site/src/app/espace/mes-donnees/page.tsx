import type { Metadata } from "next"
import { PersonalDataPage } from "@/modules/citizen/ui/pages/personal-data"

export const metadata: Metadata = { title: "Mes données" }

/** F55 : export des données personnelles, après confirmation d’identité. */
export default PersonalDataPage
