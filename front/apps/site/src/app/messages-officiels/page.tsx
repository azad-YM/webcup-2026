import type { Metadata } from "next"
import { OfficialMessagesPage } from "@/modules/public/ui/pages/official-messages"

export const metadata: Metadata = { title: "Messages officiels" }

export default function MessagesOfficielsRoute() {
  return <OfficialMessagesPage />
}
